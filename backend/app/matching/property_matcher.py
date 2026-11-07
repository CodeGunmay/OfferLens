"""Layer 1 matching: property / product identity.

Pipeline (offline batch in production, run at seed time in this prototype):
  1. Blocking     — only compare listings in the same city + shared name token.
  2. Pairwise     — compute similarity features for each blocked pair.
  3. Confidence   — transparent weighted blend of the features.
  4. Safety caps  — contradictions (very different geography or star class)
                    can never reach the auto-match band.
  5. Banding      — high (auto-suggest) / medium (human review) / low (keep apart).
"""
from dataclasses import dataclass, field

from app.matching.normalize import core_tokens, normalize_city
from app.matching.similarity import (
    address_similarity,
    attribute_agreement,
    geo_similarity,
    name_similarity,
)

# Feature weights — deliberately simple and auditable, and category-aware.
# For sightseeing the attraction's location is a stronger identity signal than
# the tour title, so geography carries more weight there.
FEATURE_WEIGHTS_BY_CATEGORY = {
    "hotel": {"name": 0.35, "geo": 0.30, "address": 0.20, "attributes": 0.15},
    "sightseeing": {"name": 0.30, "geo": 0.40, "address": 0.10, "attributes": 0.20},
}
FEATURE_WEIGHTS = FEATURE_WEIGHTS_BY_CATEGORY["hotel"]

HIGH_BAND = 0.85
MEDIUM_BAND = 0.72

# Safety caps: a pair can never be auto-merged past these thresholds.
MAX_CONFIDENCE_IF_FAR_APART = 0.50      # > 3 km apart
MAX_CONFIDENCE_IF_STAR_GAP_2 = 0.55     # two or more star classes apart
MAX_CONFIDENCE_WITH_CONFLICT = 0.84     # any contradiction stays in the review band


@dataclass
class ListingSnapshot:
    id: int
    name: str
    city: str
    address: str
    latitude: float
    longitude: float
    star_rating: float | None
    amenities: list[str] = field(default_factory=list)
    category: str = "hotel"


@dataclass
class MatchResult:
    listing_a_id: int
    listing_b_id: int
    confidence: float
    band: str
    evidence: dict
    conflicts: list[str]
    missing: list[str]
    summary: str


def blocking_key(listing: ListingSnapshot) -> tuple[str, str]:
    """Coarse bucket: city + strongest core token. Keeps pair counts manageable."""
    tokens = core_tokens(listing.name, listing.category)
    anchor = tokens[0] if tokens else ""
    return normalize_city(listing.city), anchor


def build_blocked_pairs(listings: list[ListingSnapshot]) -> list[tuple[ListingSnapshot, ListingSnapshot]]:
    buckets: dict[tuple[str, str], list[ListingSnapshot]] = {}
    for listing in listings:
        buckets.setdefault(blocking_key(listing), []).append(listing)

    pairs: list[tuple[ListingSnapshot, ListingSnapshot]] = []
    for bucket in buckets.values():
        for i in range(len(bucket)):
            for j in range(i + 1, len(bucket)):
                if bucket[i].category != bucket[j].category:
                    continue
                pairs.append((bucket[i], bucket[j]))
    # Deterministic ordering keeps seeded demo output stable.
    return sorted(pairs, key=lambda p: (p[0].id, p[1].id))


def score_pair(a: ListingSnapshot, b: ListingSnapshot) -> MatchResult:
    weights = FEATURE_WEIGHTS_BY_CATEGORY.get(a.category, FEATURE_WEIGHTS_BY_CATEGORY["hotel"])
    name_score = name_similarity(a.name, b.name, a.category)
    geo_score, distance = geo_similarity(a.latitude, a.longitude, b.latitude, b.longitude)
    addr_score = address_similarity(a.address, b.address)
    attr_score, conflicts, missing = attribute_agreement(
        {"star_rating": a.star_rating, "amenities": a.amenities, "address": a.address},
        {"star_rating": b.star_rating, "amenities": b.amenities, "address": b.address},
    )

    confidence = (
        weights["name"] * name_score
        + weights["geo"] * geo_score
        + weights["address"] * addr_score
        + weights["attributes"] * attr_score
    )

    caps_applied: list[str] = []
    if distance == float("inf"):
        confidence = min(confidence, 0.45)
        caps_applied.append("Coordinates missing for at least one listing")
        missing.append("Geographic coordinates missing")
    elif distance > 3000:
        confidence = min(confidence, MAX_CONFIDENCE_IF_FAR_APART)
        caps_applied.append("Listings are more than 3 km apart")
    if a.star_rating and b.star_rating and abs(a.star_rating - b.star_rating) >= 2:
        confidence = min(confidence, MAX_CONFIDENCE_IF_STAR_GAP_2)
        caps_applied.append("Star class differs by two or more")

    # A detected contradiction must never reach the auto-suggest band: the pair
    # always goes to a human, however strong the other signals are.
    if conflicts:
        confidence = min(confidence, MAX_CONFIDENCE_WITH_CONFLICT)
        caps_applied.append("Conflicting attribute present — human review required")

    confidence = round(min(max(confidence, 0.0), 0.99), 4)
    band = "high" if confidence >= HIGH_BAND else "medium" if confidence >= MEDIUM_BAND else "low"

    evidence = {
        "name_similarity": name_score,
        "geo_similarity": round(geo_score, 4),
        "distance_m": None if distance == float("inf") else round(distance),
        "address_similarity": addr_score,
        "attribute_agreement": attr_score,
        "weights": weights,
        "contributions": {
            "name": round(weights["name"] * name_score, 4),
            "geo": round(weights["geo"] * geo_score, 4),
            "address": round(weights["address"] * addr_score, 4),
            "attributes": round(weights["attributes"] * attr_score, 4),
        },
        "caps_applied": caps_applied,
        "band_thresholds": {"high": HIGH_BAND, "medium": MEDIUM_BAND},
    }

    if band == "high":
        summary = "Names, location and attributes agree — safe to suggest as the same property."
    elif band == "medium":
        summary = "Likely the same property, but at least one attribute needs a human decision."
    else:
        summary = "Evidence is too weak to treat these as the same property — keep separate."

    return MatchResult(
        listing_a_id=a.id,
        listing_b_id=b.id,
        confidence=confidence,
        band=band,
        evidence=evidence,
        conflicts=conflicts,
        missing=missing,
        summary=summary,
    )


def run_matching(listings: list[ListingSnapshot]) -> list[MatchResult]:
    return [score_pair(a, b) for a, b in build_blocked_pairs(listings)]
