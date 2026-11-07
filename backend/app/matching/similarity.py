"""Similarity features for pairwise product-identity matching."""
from difflib import SequenceMatcher

from app.matching.amenities import canonical_set
from app.matching.normalize import core_tokens, haversine_m, normalize_text, tokenize

FUZZY_TOKEN_THRESHOLD = 0.85


def _token_match(a: str, b: str) -> bool:
    if a == b:
        return True
    return SequenceMatcher(None, a, b).ratio() >= FUZZY_TOKEN_THRESHOLD


def token_overlap(tokens_a: list[str], tokens_b: list[str]) -> float:
    """Fuzzy token overlap.

    Blends containment (how much of the shorter name is covered) with Jaccard.
    Containment matters because supplier names routinely add or drop qualifiers
    ("Taj Palace" vs "Taj Palace, Sardar Patel Marg") — that should not halve the
    similarity of an otherwise identical name.
    """
    set_a, set_b = set(tokens_a), set(tokens_b)
    if not set_a or not set_b:
        return 0.0

    matched_a = {a for a in set_a if any(_token_match(a, b) for b in set_b)}
    matched_b = {b for b in set_b if any(_token_match(b, a) for a in set_a)}
    intersection = min(len(matched_a), len(matched_b))
    if intersection == 0:
        return 0.0

    union = len(set_a) + len(set_b) - intersection
    jaccard = intersection / union
    containment = intersection / min(len(set_a), len(set_b))
    return round(0.7 * containment + 0.3 * jaccard, 4)


def name_similarity(name_a: str, name_b: str, category: str = "hotel") -> float:
    """Blend of core-name overlap, full-name overlap and character similarity.

    Core-name overlap dominates. For sightseeing, tour-format wording
    ("guided visit with transfers") is stripped before comparison because it
    belongs to the activity-configuration layer, not to product identity.
    """
    core_a = core_tokens(name_a, category)
    core_b = core_tokens(name_b, category)
    core_score = token_overlap(core_a, core_b)
    full_score = token_overlap(tokenize(name_a), tokenize(name_b))
    char_score = SequenceMatcher(None, normalize_text(name_a), normalize_text(name_b)).ratio()
    return round(0.55 * core_score + 0.25 * full_score + 0.20 * char_score, 4)


def geo_similarity(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> tuple[float, float]:
    """Return (similarity 0-1, distance in metres) with a 1200 m decay constant."""
    from math import exp

    distance = haversine_m(lat_a, lon_a, lat_b, lon_b)
    if distance == float("inf"):
        return 0.0, distance
    return round(exp(-distance / 1200), 4), round(distance, 1)


def address_similarity(addr_a: str, addr_b: str) -> float:
    if not addr_a or not addr_b:
        return 0.0
    return round(
        0.65 * token_overlap(tokenize(addr_a), tokenize(addr_b))
        + 0.35 * SequenceMatcher(None, normalize_text(addr_a), normalize_text(addr_b)).ratio(),
        4,
    )


def attribute_agreement(listing_a: dict, listing_b: dict) -> tuple[float, list[str], list[str]]:
    """Compare star rating and canonicalized amenity sets.

    Returns (score, conflicts, missing) with plain-language labels that are shown
    verbatim in the review UI.
    """
    conflicts: list[str] = []
    missing: list[str] = []
    scores: list[float] = []

    star_a, star_b = listing_a.get("star_rating"), listing_b.get("star_rating")
    if star_a is None or star_b is None:
        missing.append("Star rating not published by one supplier")
    else:
        diff = abs(float(star_a) - float(star_b))
        scores.append(max(0.0, 1 - diff / 2))
        if diff >= 1:
            conflicts.append(f"Star rating differs ({star_a:g}★ vs {star_b:g}★)")

    amenities_a = canonical_set(listing_a.get("amenities"))
    amenities_b = canonical_set(listing_b.get("amenities"))
    if not amenities_a or not amenities_b:
        missing.append("Amenity list incomplete")
    else:
        scores.append(len(amenities_a & amenities_b) / len(amenities_a | amenities_b))

    if not listing_a.get("address") or not listing_b.get("address"):
        missing.append("Address missing")

    score = sum(scores) / len(scores) if scores else 0.4
    return round(score, 4), conflicts, missing
