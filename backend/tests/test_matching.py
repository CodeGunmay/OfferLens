"""Layer-1 matching behaviour: similarity features, safety caps and banding."""
from app.matching.amenities import canonical_set
from app.matching.normalize import core_tokens, haversine_m, normalize_text
from app.matching.property_matcher import (
    HIGH_BAND,
    MEDIUM_BAND,
    ListingSnapshot,
    build_blocked_pairs,
    score_pair,
)
from app.matching.similarity import name_similarity, token_overlap


def _listing(**overrides) -> ListingSnapshot:
    base = dict(
        id=1,
        name="Grand Imperial Hotel Delhi",
        city="New Delhi",
        address="Janpath Road, Connaught Place, New Delhi 110001",
        latitude=28.6251,
        longitude=77.2193,
        star_rating=5.0,
        amenities=["Free WiFi", "Outdoor pool", "Spa"],
        category="hotel",
    )
    base.update(overrides)
    return ListingSnapshot(**base)


def test_normalization_strips_locality_and_generic_words():
    assert core_tokens("The Grand Imperial, New Delhi") == ["grand", "imperial"]
    assert core_tokens("Taj Mahal Guided Visit with Transfers", "sightseeing") == ["taj", "mahal"]
    assert normalize_text("  The  Grand-Imperial!! ") == "the grand imperial"


def test_token_overlap_is_containment_aware():
    # A qualifier added by one supplier must not halve the similarity.
    assert token_overlap(["taj", "palace"], ["taj", "palace", "marg"]) > 0.7
    assert token_overlap(["taj", "palace"], ["oberoi"]) == 0.0


def test_same_property_variants_score_high():
    a = _listing()
    b = _listing(id=2, name="The Grand Imperial New Delhi", latitude=28.6248, longitude=77.2201,
                 amenities=["WiFi", "Pool", "Spa", "Gym"])
    assert name_similarity(a.name, b.name) > 0.85
    result = score_pair(a, b)
    assert result.confidence >= HIGH_BAND
    assert result.band == "high"
    assert result.conflicts == []


def test_hard_negative_scores_low_and_is_capped():
    a = _listing()
    guest_house = _listing(
        id=3,
        name="Grand Imperial Guest House",
        address="Main Bazaar, Paharganj, New Delhi 110055",
        latitude=28.6420,
        longitude=77.2100,
        star_rating=3.0,
        amenities=["Free WiFi"],
    )
    result = score_pair(a, guest_house)
    assert result.confidence < MEDIUM_BAND
    assert result.band == "low"
    assert any("Star rating" in conflict for conflict in result.conflicts)


def test_conflicting_attribute_never_reaches_auto_band():
    a = _listing()
    four_star = _listing(id=4, name="Grand Imperial Hotel Delhi", star_rating=4.0,
                         amenities=["WiFi", "Pool", "Spa"])
    result = score_pair(a, four_star)
    assert result.conflicts
    # A contradiction caps confidence below the auto-suggest band regardless of name/geo.
    assert result.confidence < HIGH_BAND


def test_distance_decay_and_haversine():
    distance = haversine_m(28.6251, 77.2193, 28.6420, 77.2100)
    assert 1000 < distance < 3000


def test_blocking_only_pairs_shared_anchors():
    listings = [
        _listing(id=1, name="Taj Palace New Delhi"),
        _listing(id=2, name="Taj Palace, Sardar Patel Marg"),
        _listing(id=3, name="The Oberoi Mumbai", city="Mumbai", latitude=18.92, longitude=72.82),
    ]
    pairs = {(a.id, b.id) for a, b in build_blocked_pairs(listings)}
    assert (1, 2) in pairs
    assert (1, 3) not in pairs  # different city + no shared anchor


def test_amenity_alias_normalization():
    assert canonical_set(["Free WiFi", "Gym", "Swimming pool"]) == canonical_set(["WiFi", "Fitness centre", "Pool"])
