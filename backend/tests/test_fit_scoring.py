"""Profile-driven recommendation behaviour."""
from app.services.assumptions import DEFAULT_ASSUMPTIONS, DEFAULT_PROFILES, assumptions_dict
from app.services.fit_scoring import evaluate_offers

ASSUMPTIONS = assumptions_dict(DEFAULT_ASSUMPTIONS)
PROFILES = {profile["key"]: profile["weights"] for profile in DEFAULT_PROFILES}

HOTEL_OFFERS = [
    dict(id="atlas", supplier_name="Supplier Atlas", base_price=5000, meal_plan="Breakfast", refundable=True,
         cancellation_deadline_hours=24, payment_terms="Pay now", availability=6, content_completeness=92,
         listed_price=5000, currency="INR"),
    dict(id="meridian", supplier_name="Supplier Meridian", base_price=4500, meal_plan="Room only", refundable=False,
         cancellation_deadline_hours=None, payment_terms="Pay now", availability=9, content_completeness=74,
         listed_price=4500, currency="INR"),
    dict(id="horizon", supplier_name="Supplier Horizon", base_price=5200, meal_plan="Breakfast", refundable=True,
         cancellation_deadline_hours=48, payment_terms="Pay at hotel", availability=3, content_completeness=88,
         listed_price=5200, currency="INR"),
]


def _recommended(profile_key: str) -> str:
    result = evaluate_offers(HOTEL_OFFERS, PROFITS_SAFE(profile_key), ASSUMPTIONS, "hotel")
    return result["recommended_offer_id"]


def PROFITS_SAFE(profile_key: str) -> dict:
    return {**PROFILES[profile_key], "_profile_name": profile_key}


def test_cheapest_listed_is_never_recommended_here():
    for profile in ("budget", "flexible", "family", "business"):
        assert _recommended(profile) != "meridian"


def test_recommendation_changes_with_profile():
    budget = _recommended("budget")
    flexible = _recommended("flexible")
    assert budget != flexible
    assert budget == "atlas"       # price-led profile prefers the cheapest effective price
    assert flexible == "horizon"   # flexibility-led profile prefers 48h cancellation + pay at hotel


def test_effective_price_is_profile_independent():
    budget = evaluate_offers(HOTEL_OFFERS, PROFITS_SAFE("budget"), ASSUMPTIONS, "hotel")
    flexible = evaluate_offers(HOTEL_OFFERS, PROFITS_SAFE("flexible"), ASSUMPTIONS, "hotel")
    prices_budget = {offer["id"]: offer["effective"]["effective_price"] for offer in budget["offers"]}
    prices_flexible = {offer["id"]: offer["effective"]["effective_price"] for offer in flexible["offers"]}
    assert prices_budget == prices_flexible


def test_weights_are_normalised_and_scores_bounded():
    # Weights need not sum to 100: contributions are normalised by their total,
    # so the fit score always stays on a 0-100 scale.
    result = evaluate_offers(
        HOTEL_OFFERS,
        {"price": 50, "meals": 50, "cancellation": 50, "payment": 50, "convenience": 50,
         "_profile_name": "custom"},
        ASSUMPTIONS,
        "hotel",
    )
    for offer in result["offers"]:
        assert 0 <= offer["fit_score"] <= 100
        assert abs(sum(offer["contributions"].values()) * 100 - offer["fit_score"]) < 0.2
        assert offer["reasons"]


def test_trap_note_explains_cheapest_listed():
    result = evaluate_offers(HOTEL_OFFERS, PROFITS_SAFE("flexible"), ASSUMPTIONS, "hotel")
    assert result["cheapest_listed_offer_id"] == "meridian"
    assert result["cheapest_trap_note"] is not None
    assert "4,500" in result["cheapest_trap_note"]
