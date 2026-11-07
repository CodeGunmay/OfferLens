"""Default monetary assumptions for the effective-price model.

Every assumption is paired with an explicit source label. Because this
prototype has no access to a verified market-rate feed, all values are marked
as editable illustrative assumptions — they are never presented as facts and
they are surfaced in the UI next to any money figure derived from them.
"""
from typing import Any

ILLUSTRATIVE = "Illustrative assumption — editable, no verified market source"

DEFAULT_ASSUMPTIONS: list[dict[str, Any]] = [
    {
        "key": "breakfast_value_per_night",
        "label": "Breakfast value (per room, per night)",
        "value": 450.0,
        "unit": "INR",
        "category": "hotel",
        "source": ILLUSTRATIVE,
    },
    {
        "key": "non_refundable_risk_pct",
        "label": "Risk premium for non-refundable rate",
        "value": 6.0,
        "unit": "% of base price",
        "category": "hotel",
        "source": ILLUSTRATIVE,
    },
    {
        "key": "short_window_risk_pct",
        "label": "Risk premium for a 24-hour cancellation window",
        "value": 2.0,
        "unit": "% of base price",
        "category": "hotel",
        "source": ILLUSTRATIVE,
    },
    {
        "key": "prepayment_cost_pct",
        "label": "Cost of full prepayment (working capital)",
        "value": 1.5,
        "unit": "% of base price",
        "category": "hotel",
        "source": ILLUSTRATIVE,
    },
    {
        "key": "deposit_cost_pct",
        "label": "Cost of a partial deposit",
        "value": 0.75,
        "unit": "% of base price",
        "category": "hotel",
        "source": ILLUSTRATIVE,
    },
    {
        "key": "transfers_value",
        "label": "Hotel transfers value (per person)",
        "value": 600.0,
        "unit": "INR",
        "category": "sightseeing",
        "source": ILLUSTRATIVE,
    },
    {
        "key": "sightseeing_meal_value",
        "label": "Included meal value (per person)",
        "value": 250.0,
        "unit": "INR",
        "category": "sightseeing",
        "source": ILLUSTRATIVE,
    },
    {
        "key": "non_refundable_tour_risk_pct",
        "label": "Risk premium for a non-refundable tour",
        "value": 5.0,
        "unit": "% of base price",
        "category": "sightseeing",
        "source": ILLUSTRATIVE,
    },
    {
        "key": "partial_cancellation_risk_pct",
        "label": "Risk premium for partial cancellation terms",
        "value": 3.0,
        "unit": "% of base price",
        "category": "sightseeing",
        "source": ILLUSTRATIVE,
    },
]

DEFAULT_PROFILES: list[dict[str, Any]] = [
    {
        "key": "budget",
        "name": "Budget Traveller",
        "description": "Price-led client; will trade flexibility for a lower total cost.",
        "weights": {"price": 50, "meals": 25, "cancellation": 10, "payment": 10, "convenience": 5},
        "is_default": False,
    },
    {
        "key": "flexible",
        "name": "Flexible Traveller",
        "description": "Plans may change; cancellation flexibility and pay-at-hotel matter most.",
        "weights": {"price": 15, "meals": 15, "cancellation": 45, "payment": 15, "convenience": 10},
        "is_default": True,
    },
    {
        "key": "family",
        "name": "Family Traveller",
        "description": "Needs breakfast and generous occupancy; values low-friction changes.",
        "weights": {"price": 30, "meals": 30, "cancellation": 20, "payment": 10, "convenience": 10},
        "is_default": False,
    },
    {
        "key": "business",
        "name": "Business Traveller",
        "description": "Corporate policy prefers transparent content and predictable settlement.",
        "weights": {"price": 25, "meals": 20, "cancellation": 15, "payment": 15, "convenience": 25},
        "is_default": False,
    },
]

DEFAULT_RANKING_WEIGHTS = {
    "effective_price": 30,
    "availability": 20,
    "content_completeness": 15,
    "cancellation": 15,
    "match_confidence": 20,
}

DIMENSION_LABELS = {
    "price": "Effective price",
    "meals": "Meals",
    "cancellation": "Cancellation flexibility",
    "payment": "Payment flexibility",
    "convenience": "Convenience & content",
    "effective_price": "Effective-price competitiveness",
    "availability": "Availability",
    "content_completeness": "Content completeness",
    "match_confidence": "Match confidence",
}


def assumptions_dict(records: list[dict[str, Any]]) -> dict[str, float]:
    return {record["key"]: float(record["value"]) for record in records}
