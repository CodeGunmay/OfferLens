"""Effective-price model.

A listed price is not an offer's true cost. A room-only, non-refundable rate at
₹4,500 and a breakfast-inclusive, freely cancellable rate at ₹5,000 are not
"₹500 apart" — the missing breakfast has a value and the lost cancellation
right carries risk.

effective_price = base_price
                + value of inclusions the offer is missing
                + risk premium for restrictive terms
                + financing cost of prepayment

Every added rupee is traceable to a named assumption (see assumptions.py) and
is disclosed in the API response. This is decision support, not market truth.
"""
from typing import Any

BREAKFAST_KEYS = {"breakfast", "breakfast + dinner", "half board", "all inclusive"}


def _pct(value: float, pct: float) -> float:
    return round(value * pct / 100, 2)


def meal_inclusion_score(meal_plan: str) -> float:
    """0 (room only) .. 1 (breakfast or better included)."""
    plan = (meal_plan or "").strip().lower()
    if not plan or "room only" in plan or "no meal" in plan:
        return 0.0
    if "all inclusive" in plan:
        return 1.0
    if "half board" in plan or "dinner" in plan:
        return 0.85
    if "breakfast" in plan:
        return 1.0
    return 0.3


def cancellation_score(refundable: bool, deadline_hours: int | None) -> float:
    if not refundable:
        return 0.0
    if deadline_hours is None:
        return 0.5
    if deadline_hours >= 48:
        return 1.0
    if deadline_hours >= 24:
        return 0.8
    return 0.55


def payment_score(payment_terms: str) -> float:
    terms = (payment_terms or "").strip().lower()
    if "hotel" in terms:
        return 1.0
    if "deposit" in terms or "partial" in terms:
        return 0.6
    return 0.2


def hotel_effective_price(offer: dict[str, Any], assumptions: dict[str, float]) -> dict[str, Any]:
    """Compute the effective price and its audit trail for one hotel rate plan."""
    base = float(offer["base_price"])
    components: list[dict[str, Any]] = [
        {
            "key": "base_price",
            "label": "Listed base price",
            "amount": round(base, 2),
            "assumption_key": None,
            "note": "As published by the supplier for this rate plan.",
        }
    ]

    meal_score = meal_inclusion_score(offer.get("meal_plan", ""))
    if meal_score < 1.0 and meal_score >= 0.0:
        breakfast_value = assumptions["breakfast_value_per_night"]
        gap = round(breakfast_value * (1 - meal_score), 2)
        if gap > 0:
            components.append(
                {
                    "key": "breakfast_gap",
                    "label": f"Breakfast not included ({offer.get('meal_plan')})",
                    "amount": gap,
                    "assumption_key": "breakfast_value_per_night",
                    "note": "Value of the inclusion this rate plan does not provide.",
                }
            )

    if not offer.get("refundable", False):
        risk = _pct(base, assumptions["non_refundable_risk_pct"])
        components.append(
            {
                "key": "non_refundable_risk",
                "label": "Non-refundable risk premium",
                "amount": risk,
                "assumption_key": "non_refundable_risk_pct",
                "note": "Carries no cancellation right; exposure is priced in.",
            }
        )
    else:
        deadline = offer.get("cancellation_deadline_hours")
        if deadline is not None and deadline <= 24:
            risk = _pct(base, assumptions["short_window_risk_pct"])
            components.append(
                {
                    "key": "short_window_risk",
                    "label": f"Short cancellation window ({deadline}h)",
                    "amount": risk,
                    "assumption_key": "short_window_risk_pct",
                    "note": "Free cancellation is granted only very close to arrival.",
                }
            )

    terms = (offer.get("payment_terms") or "").lower()
    if "hotel" not in terms:
        key = "deposit_cost_pct" if ("deposit" in terms or "partial" in terms) else "prepayment_cost_pct"
        cost = _pct(base, assumptions[key])
        components.append(
            {
                "key": "payment_cost",
                "label": f"{offer.get('payment_terms')} — settlement cost",
                "amount": cost,
                "assumption_key": key,
                "note": "Illustrative working-capital cost of settling before stay.",
            }
        )

    effective = round(sum(c["amount"] for c in components), 2)
    return {
        "effective_price": effective,
        "listed_price": round(base, 2),
        "uplift": round(effective - base, 2),
        "uplift_pct": round((effective - base) / base * 100, 2) if base else 0.0,
        "components": components,
        "currency": offer.get("currency", "INR"),
    }


def activity_effective_price(offer: dict[str, Any], assumptions: dict[str, float]) -> dict[str, Any]:
    """Effective price for a sightseeing activity offer."""
    base = float(offer.get("price", offer.get("base_price", 0)))
    components: list[dict[str, Any]] = [
        {
            "key": "base_price",
            "label": "Listed price",
            "amount": round(base, 2),
            "assumption_key": None,
            "note": f"As published by the supplier ({offer.get('price_basis', 'per person')}).",
        }
    ]

    if "included" not in (offer.get("transfers") or "").lower() or "not included" in (
        offer.get("transfers") or ""
    ).lower():
        components.append(
            {
                "key": "transfers_gap",
                "label": "Transfers not included",
                "amount": assumptions["transfers_value"],
                "assumption_key": "transfers_value",
                "note": "Cost the client would carry to reach the meeting point.",
            }
        )

    meals = (offer.get("meals") or "").lower()
    if "not included" in meals or not meals:
        components.append(
            {
                "key": "meal_gap",
                "label": "Meals not included",
                "amount": assumptions["sightseeing_meal_value"],
                "assumption_key": "sightseeing_meal_value",
                "note": "Value of the inclusion this offer does not provide.",
            }
        )

    policy = (offer.get("cancellation_policy") or "").lower()
    if "non-refundable" in policy or "non refundable" in policy:
        risk = _pct(base, assumptions["non_refundable_tour_risk_pct"])
        components.append(
            {
                "key": "non_refundable_risk",
                "label": "Non-refundable risk premium",
                "amount": risk,
                "assumption_key": "non_refundable_tour_risk_pct",
                "note": "No cancellation right on the tour.",
            }
        )
    elif "partial" in policy:
        risk = _pct(base, assumptions["partial_cancellation_risk_pct"])
        components.append(
            {
                "key": "partial_cancel_risk",
                "label": "Partial cancellation risk premium",
                "amount": risk,
                "assumption_key": "partial_cancellation_risk_pct",
                "note": "Only part of the tour cost is refundable.",
            }
        )

    effective = round(sum(c["amount"] for c in components), 2)
    return {
        "effective_price": effective,
        "listed_price": round(base, 2),
        "uplift": round(effective - base, 2),
        "uplift_pct": round((effective - base) / base * 100, 2) if base else 0.0,
        "components": components,
        "currency": offer.get("currency", "INR"),
    }
