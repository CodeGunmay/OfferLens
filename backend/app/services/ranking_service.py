"""Listing-page ranking intelligence built on the consolidated offer set."""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ProductGroup
from app.ranking.listing_ranker import rank_offers
from app.services.assumptions import DEFAULT_RANKING_WEIGHTS
from app.services.offer_service import assumptions_map, load_assumptions
from app.services.effective_price import activity_effective_price, hotel_effective_price
from app.services.serializers import group_public
from app.services.offer_service import _activity_offers, _hotel_offers


def _rankable(offers: list[dict[str, Any]], assumptions: dict[str, float], category: str) -> list[dict[str, Any]]:
    rows = []
    for offer in offers:
        priced = (
            hotel_effective_price(offer, assumptions)
            if category == "hotel"
            else activity_effective_price(offer, assumptions)
        )
        rows.append(
            {
                "id": offer["id"],
                "supplier_name": offer["supplier_name"],
                "supplier_code": offer["supplier_code"],
                "listing_name": offer["listing_name"],
                "room_or_activity": offer.get("room_category") or offer.get("activity_name"),
                "listed_price": offer["listed_price"],
                "effective_price": priced["effective_price"],
                "meal_plan": offer.get("meal_plan") or offer.get("meals"),
                "cancellation": offer.get("cancellation_policy_note") or offer.get("cancellation_policy"),
                "refundable": offer["refundable"],
                "cancellation_deadline_hours": offer["cancellation_deadline_hours"],
                "payment_terms": offer.get("payment_terms"),
                "availability": offer["availability"],
                "content_completeness": offer["content_completeness"],
                "match_confidence": offer["match_confidence"],
            }
        )
    return rows


def build_ranking(
    db: Session,
    group_code: str,
    weights: dict[str, float] | None = None,
    equivalence_class: str | None = None,
) -> dict[str, Any] | None:
    group = db.scalar(select(ProductGroup).where(ProductGroup.code == group_code))
    if group is None:
        return None

    assumptions = assumptions_map(db)
    if group.category == "hotel":
        offers, chosen = _hotel_offers(db, group, equivalence_class)
    else:
        offers, chosen = _activity_offers(db, group, equivalence_class)

    rankable = _rankable(offers, assumptions, group.category)
    result = rank_offers(rankable, weights or DEFAULT_RANKING_WEIGHTS)

    listing_names = [row["listing_name"] for row in result["offers"]]
    before = {
        "title": "Before consolidation",
        "fragmented": [
            {
                "supplier": row["supplier_name"],
                "title": row["listing_name"],
                "line": row["room_or_activity"],
                "price": row["listed_price"],
            }
            for row in result["offers"]
        ],
        "problem": (
            f"{len(listing_names)} supplier listings for one product, each with its own title, "
            "its own room wording and its own price — the agent has to reconcile them by hand."
        ),
    }
    after = {
        "title": "After consolidation",
        "product": group.canonical_name,
        "offers": [
            {
                "position": row["position"],
                "supplier": row["supplier_name"],
                "offer": row["room_or_activity"],
                "effective_price": row["effective_price"],
                "score": row["score"],
            }
            for row in result["offers"]
        ],
        "benefit": (
            "One product identity, comparable bookable offers, and a ranking whose weights "
            "the agent can inspect and adjust."
        ),
    }
    return {
        "group": group_public(group),
        "category": group.category,
        "equivalence_class": chosen,
        "weights": result["weights"],
        "offers": result["offers"],
        "model_note": result["model_note"],
        "default_weights": DEFAULT_RANKING_WEIGHTS,
        "before": before,
        "after": after,
        "assumptions": load_assumptions(db),
    }
