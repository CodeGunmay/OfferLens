"""Client-profile fit scoring on top of the effective-price model.

The effective price answers "what does this offer really cost?". The fit score
answers "how well does it suit *this* client?". Both are shown together, and the
weighting used for the fit score is always visible and adjustable.
"""
from typing import Any

from app.services.assumptions import DIMENSION_LABELS
from app.services.effective_price import (
    activity_effective_price,
    cancellation_score,
    hotel_effective_price,
    meal_inclusion_score,
    payment_score,
)

PROFILE_DIMENSIONS = ["price", "meals", "cancellation", "payment", "convenience"]

# The same five profile weights are reused across categories, but "payment"
# means settlement flexibility for hotels and transfer logistics for tours.
CATEGORY_DIMENSION_LABELS = {
    "hotel": {
        "price": "Effective price",
        "meals": "Meals included",
        "cancellation": "Cancellation flexibility",
        "payment": "Payment flexibility",
        "convenience": "Convenience & content",
    },
    "sightseeing": {
        "price": "Effective price",
        "meals": "Meals included",
        "cancellation": "Cancellation flexibility",
        "payment": "Transfers & logistics",
        "convenience": "Access & experience",
    },
}

SCORE_BASIS = (
    "Dimension scores are normalized to 0–1 within this comparison set only. "
    "They rank the offers in front of you — they are not absolute quality scores."
)


def _minmax_inverted(values: list[float]) -> list[float]:
    """Lower is better. All-equal sets score 1.0 so price never dominates by default."""
    low, high = min(values), max(values)
    if high - low < 0.01:
        return [1.0 for _ in values]
    return [round((high - value) / (high - low), 4) for value in values]


def _transfers_score(transfers: str) -> float:
    text = (transfers or "").lower()
    if "not included" in text:
        return 0.0
    if "hotel pickup" in text or "hotel pick-up" in text:
        return 1.0
    if "included" in text:
        return 0.85
    if "meeting point" in text:
        return 0.35
    return 0.2


def _access_score(access_type: str, experience_type: str) -> float:
    access = (access_type or "").lower()
    access_value = 1.0 if "skip" in access else 0.6
    experience = (experience_type or "").lower()
    if "private" in experience:
        experience_value = 1.0
    elif "small" in experience:
        experience_value = 0.85
    else:
        experience_value = 0.6
    return round(0.6 * access_value + 0.4 * experience_value, 4)


def _hotel_dimensions(offer: dict[str, Any]) -> dict[str, float]:
    return {
        "meals": meal_inclusion_score(offer.get("meal_plan", "")),
        "cancellation": cancellation_score(
            bool(offer.get("refundable")), offer.get("cancellation_deadline_hours")
        ),
        "payment": payment_score(offer.get("payment_terms", "")),
        "convenience": round((offer.get("content_completeness") or 0) / 100, 4),
    }


def _activity_dimensions(offer: dict[str, Any]) -> dict[str, float]:
    meals = (offer.get("meals") or "").lower()
    return {
        "meals": 0.0 if ("not included" in meals or not meals) else 1.0,
        "cancellation": cancellation_score(
            "free" in (offer.get("cancellation_policy") or "").lower(),
            offer.get("cancellation_window_hours"),
        ),
        "payment": _transfers_score(offer.get("transfers", "")),
        "convenience": _access_score(offer.get("access_type", ""), offer.get("experience_type", "")),
    }


def _describe_offer(offer: dict[str, Any], kind: str) -> str:
    if kind == "hotel":
        return (
            f"{offer.get('meal_plan')}, "
            f"{'free cancellation until ' + str(offer.get('cancellation_deadline_hours')) + 'h' if offer.get('refundable') else 'non-refundable'}, "
            f"{offer.get('payment_terms')}"
        )
    return (
        f"{offer.get('duration_hours')}h {offer.get('experience_type', '').lower()} tour, "
        f"transfers {str(offer.get('transfers', '')).lower()}, {offer.get('cancellation_policy')}"
    )


def _top_dimensions(contributions: dict[str, float], labels: dict[str, str], count: int = 2) -> list[str]:
    ordered = sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
    return [labels.get(key, key) for key, _ in ordered[:count] if _ > 0]


def evaluate_offers(
    offers: list[dict[str, Any]],
    weights: dict[str, float],
    assumptions: dict[str, float],
    kind: str = "hotel",
) -> dict[str, Any]:
    """Score every offer in a comparison set and pick a recommendation."""
    if not offers:
        return {"offers": [], "recommendation": None}

    priced = []
    for offer in offers:
        priced_result = (
            hotel_effective_price(offer, assumptions)
            if kind == "hotel"
            else activity_effective_price(offer, assumptions)
        )
        dims = _hotel_dimensions(offer) if kind == "hotel" else _activity_dimensions(offer)
        priced.append({"offer": offer, "price": priced_result, "dims": dims})

    price_scores = _minmax_inverted([p["price"]["effective_price"] for p in priced])

    labels = CATEGORY_DIMENSION_LABELS.get(kind, CATEGORY_DIMENSION_LABELS["hotel"])
    total_weight = sum(float(weights.get(d, 0)) for d in PROFILE_DIMENSIONS) or 1.0

    enriched = []
    for index, entry in enumerate(priced):
        dims = {**entry["dims"], "price": price_scores[index]}
        contributions = {
            dim: round(dims.get(dim, 0) * float(weights.get(dim, 0)) / total_weight, 4)
            for dim in PROFILE_DIMENSIONS
        }
        fit = round(sum(contributions.values()) * 100, 1)
        enriched.append(
            {
                **entry["offer"],
                "effective": entry["price"],
                "dimensions": {dim: round(dims[dim], 4) for dim in PROFILE_DIMENSIONS},
                "contributions": contributions,
                "fit_score": fit,
            }
        )

    enriched.sort(key=lambda item: item["fit_score"], reverse=True)
    for position, item in enumerate(enriched, start=1):
        item["fit_rank"] = position

    # Callers always supply `listed_price`; fall back to the base price so the
    # module stays usable with minimal offer dicts (e.g. in tests).
    for item in enriched:
        item.setdefault("listed_price", item.get("base_price", 0))

    cheapest_listed = min(enriched, key=lambda item: item["listed_price"])
    cheapest_effective = min(enriched, key=lambda item: item["effective"]["effective_price"])
    recommended = enriched[0]

    for item in enriched:
        reasons: list[str] = []
        warnings: list[str] = []
        strongest = _top_dimensions(item["contributions"], labels)
        if item["id"] == recommended["id"]:
            reasons.append(
                "Best overall fit for this profile — strongest on "
                + " and ".join(strongest).lower()
                + "."
            )
        else:
            gap = round(recommended["fit_score"] - item["fit_score"], 1)
            reasons.append(f"{gap} points behind the recommended offer on the weighted profile.")
            weakest = sorted(item["dimensions"].items(), key=lambda kv: kv[1])[0]
            reasons.append(f"Weakest dimension: {labels.get(weakest[0], weakest[0])}.")

        if item["id"] == cheapest_listed["id"]:
            reasons.append(
                f"Cheapest listed price at ₹{item['listed_price']:,.0f} — but the effective price is "
                f"₹{item['effective']['effective_price']:,.0f} once missing inclusions and risk are priced in."
            )
        if item["dimensions"]["cancellation"] == 0:
            warnings.append("No cancellation right — changes will be charged in full.")
        if item["dimensions"]["price"] == 0 and item["id"] != cheapest_listed["id"]:
            warnings.append("Most expensive offer in this comparison on an effective basis.")
        if (item.get("content_completeness") or 100) < 75:
            warnings.append("Supplier content is incomplete — confirm inclusions before quoting.")
        if (item.get("availability") or 0) <= 2:
            warnings.append("Low availability — re-check inventory before confirming.")

        item["reasons"] = reasons
        item["warnings"] = warnings
        item["summary"] = _describe_offer(item, kind)

    recommendation_reason = (
        f"{recommended.get('supplier_name', 'Supplier')} ranks first for "
        f"{weights.get('_profile_name', 'this profile')} "
        f"(fit {recommended['fit_score']}/100) — strongest on "
        + " and ".join(_top_dimensions(recommended["contributions"], labels, 3)).lower()
        + "."
    )

    trap_note = None
    if cheapest_listed["id"] != recommended["id"]:
        delta = (
            cheapest_listed["effective"]["effective_price"]
            - recommended["effective"]["effective_price"]
        )
        trap_note = (
            f"Lowest listed price is {cheapest_listed.get('supplier_name')} at "
            f"₹{cheapest_listed['listed_price']:,.0f}, but its effective price is "
            f"₹{cheapest_listed['effective']['effective_price']:,.0f}"
            + (
                f" — ₹{abs(delta):,.0f} {'more' if delta > 0 else 'less'} than the recommended offer's effective price."
                if abs(delta) >= 1
                else "."
            )
        )

    return {
        "offers": enriched,
        "recommended_offer_id": recommended["id"],
        "cheapest_listed_offer_id": cheapest_listed["id"],
        "cheapest_effective_offer_id": cheapest_effective["id"],
        "recommendation_reason": recommendation_reason,
        "cheapest_trap_note": trap_note,
        "dimension_labels": labels,
        "score_basis": SCORE_BASIS,
        "weights": {dim: float(weights.get(dim, 0)) for dim in PROFILE_DIMENSIONS},
    }
