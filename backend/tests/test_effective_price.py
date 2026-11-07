"""Effective-price model: every adjustment must be traceable and directional."""
from app.services.assumptions import DEFAULT_ASSUMPTIONS, assumptions_dict
from app.services.effective_price import (
    activity_effective_price,
    cancellation_score,
    hotel_effective_price,
    meal_inclusion_score,
    payment_score,
)

ASSUMPTIONS = assumptions_dict(DEFAULT_ASSUMPTIONS)


def _offer(**overrides):
    base = dict(
        base_price=5000,
        currency="INR",
        meal_plan="Breakfast",
        refundable=True,
        cancellation_deadline_hours=48,
        payment_terms="Pay at hotel",
    )
    base.update(overrides)
    return base


def test_fully_inclusive_offer_has_no_uplift():
    priced = hotel_effective_price(_offer(), ASSUMPTIONS)
    assert priced["effective_price"] == 5000
    assert priced["uplift"] == 0
    assert len(priced["components"]) == 1


def test_room_only_non_refundable_prepaid_is_penalised():
    priced = hotel_effective_price(
        _offer(base_price=4500, meal_plan="Room only", refundable=False,
               cancellation_deadline_hours=None, payment_terms="Pay now"),
        ASSUMPTIONS,
    )
    keys = {component["key"] for component in priced["components"]}
    assert {"breakfast_gap", "non_refundable_risk", "payment_cost"} <= keys
    assert priced["effective_price"] > 4500
    # Every added rupee must name the assumption behind it.
    for component in priced["components"]:
        if component["key"] != "base_price":
            assert component["assumption_key"]


def test_cheapest_listed_can_be_most_expensive_effective():
    offers = [
        _offer(base_price=5000, meal_plan="Breakfast", refundable=True, cancellation_deadline_hours=24, payment_terms="Pay now"),
        _offer(base_price=4500, meal_plan="Room only", refundable=False, cancellation_deadline_hours=None, payment_terms="Pay now"),
        _offer(base_price=5200, meal_plan="Breakfast", refundable=True, cancellation_deadline_hours=48, payment_terms="Pay at hotel"),
    ]
    priced = [hotel_effective_price(offer, ASSUMPTIONS)["effective_price"] for offer in offers]
    assert min(offers, key=lambda offer: offer["base_price"])["base_price"] == 4500
    assert max(priced) == priced[1]
    assert priced[0] == min(priced)


def test_short_cancellation_window_carries_a_small_risk_premium():
    window_24 = hotel_effective_price(_offer(cancellation_deadline_hours=24), ASSUMPTIONS)
    window_48 = hotel_effective_price(_offer(cancellation_deadline_hours=48), ASSUMPTIONS)
    assert window_24["effective_price"] > window_48["effective_price"]


def test_sightseeing_offer_prices_transfers_and_meals():
    offer = dict(
        price=1900,
        meals="Not included",
        transfers="Not included",
        cancellation_policy="Non-refundable",
        price_basis="Per person",
    )
    priced = activity_effective_price(offer, ASSUMPTIONS)
    keys = {component["key"] for component in priced["components"]}
    assert {"transfers_gap", "meal_gap", "non_refundable_risk"} <= keys
    assert priced["effective_price"] == 2845


def test_dimension_helpers_monotonic():
    assert meal_inclusion_score("Room only") == 0.0
    assert meal_inclusion_score("Breakfast") == 1.0
    assert cancellation_score(False, None) == 0.0
    assert cancellation_score(True, 48) > cancellation_score(True, 24)
    assert payment_score("Pay at hotel") > payment_score("Deposit 20%") > payment_score("Pay now")
