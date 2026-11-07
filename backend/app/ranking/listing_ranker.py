"""Transparent listing-page ranking model.

Weights are illustrative and adjustable. Popularity / conversion is
deliberately excluded: without TBO booking data a popularity signal would be
invented, and a learned ranking model would be indefensible.
"""
from typing import Any

from app.matching.property_matcher import HIGH_BAND
from app.services.assumptions import DIMENSION_LABELS, DEFAULT_RANKING_WEIGHTS
from app.services.effective_price import cancellation_score

RANKING_COMPONENTS = [
    "effective_price",
    "availability",
    "content_completeness",
    "cancellation",
    "match_confidence",
]


def normalize_weights(weights: dict[str, float] | None) -> dict[str, float]:
    merged = {**DEFAULT_RANKING_WEIGHTS}
    for key, value in (weights or {}).items():
        if key in merged:
            merged[key] = max(0.0, min(100.0, float(value)))
    return merged


def _price_competitiveness(values: list[float]) -> list[float]:
    low, high = min(values), max(values)
    if high - low < 0.01:
        return [1.0 for _ in values]
    return [round((high - value) / (high - low), 4) for value in values]


def rank_offers(offers: list[dict[str, Any]], weights: dict[str, float] | None = None) -> dict[str, Any]:
    """Rank consolidated offers for one product group.

    Each `offer` dict carries the effective price, availability, content
    completeness, cancellation terms and the listing's match confidence.
    """
    effective_weights = normalize_weights(weights)
    total = sum(effective_weights.values()) or 1.0
    price_scores = _price_competitiveness([offer["effective_price"] for offer in offers])

    rows = []
    for offer, price_score in zip(offers, price_scores):
        availability_score = round(min(1.0, (offer.get("availability") or 0) / 8), 4)
        content_score = round((offer.get("content_completeness") or 0) / 100, 4)
        cancel_score = cancellation_score(
            bool(offer.get("refundable")), offer.get("cancellation_deadline_hours")
        )
        confidence_score = round(min(1.0, offer.get("match_confidence") or 0), 4)

        component_scores = {
            "effective_price": price_score,
            "availability": availability_score,
            "content_completeness": content_score,
            "cancellation": cancel_score,
            "match_confidence": confidence_score,
        }
        contributions = {
            key: round(component_scores[key] * effective_weights[key] / total, 4)
            for key in RANKING_COMPONENTS
        }
        score = round(sum(contributions.values()) * 100, 1)

        drivers = sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
        reasons = [
            f"{DIMENSION_LABELS[key].lower()} contributes {value * 100:.1f} pts"
            for key, value in drivers[:2]
            if value > 0
        ]
        warnings: list[str] = []
        if (offer.get("match_confidence") or 0) < HIGH_BAND:
            warnings.append(
                f"Match confidence below the {HIGH_BAND:.2f} auto-suggest threshold — product identity not confirmed."
            )
        if (offer.get("availability") or 0) <= 2:
            warnings.append("Availability is low for the selected dates.")
        if (offer.get("content_completeness") or 0) < 75:
            warnings.append("Content completeness below 75% — description may be incomplete.")

        rows.append(
            {
                **offer,
                "components": {
                    key: {
                        "label": DIMENSION_LABELS[key],
                        "weight": effective_weights[key],
                        "score": round(component_scores[key] * 100, 1),
                        "contribution": round(contributions[key] * 100, 1),
                    }
                    for key in RANKING_COMPONENTS
                },
                "score": score,
                "reasons": reasons,
                "warnings": warnings,
            }
        )

    rows.sort(key=lambda row: row["score"], reverse=True)
    for position, row in enumerate(rows, start=1):
        row["position"] = position
        row["position_reason"] = (
            f"Ranked #{position} — " + "; ".join(row["reasons"]) if row["reasons"] else f"Ranked #{position}"
        )

    return {
        "weights": effective_weights,
        "offers": rows,
        "model_note": (
            "Transparent scoring model. Weights are illustrative and adjustable. "
            "Popularity and conversion signals are deliberately excluded because no "
            "TBO booking data is used in this prototype."
        ),
    }
