"""Overview dashboard aggregation.

Every number here is computed from the demo dataset at request time, so the
dashboard cannot drift from the underlying records. Nothing on this page is a
real TBO statistic.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.matching.property_matcher import HIGH_BAND, MEDIUM_BAND
from app.models import AuditEvent, MatchCandidate, ProductGroup, Supplier, SupplierListing
from app.services.match_service import recent_reviews
from app.services.offer_service import compare_offers


def _meaningful_difference_groups(db: Session, groups: list[ProductGroup], listings: list[SupplierListing]) -> int:
    """Count products whose supplier offers differ on a commercial dimension."""
    signatures: dict[int, set[tuple]] = {}
    for listing in listings:
        if not listing.product_group_id:
            continue
        key = signatures.setdefault(listing.product_group_id, set())
        for room in listing.rooms:
            for plan in room.rate_plans:
                key.add((room.equivalence_class, plan.meal_plan, plan.refundable, plan.payment_terms))
        for activity in listing.activities:
            for offer in activity.offers:
                key.add(
                    (
                        activity.equivalence_class,
                        offer.meals,
                        offer.cancellation_policy,
                        activity.transfers,
                    )
                )
    return sum(1 for group in groups if len(signatures.get(group.id, set())) > 1)


def _price_insight(db: Session) -> dict[str, Any] | None:
    """Cheapest-listed vs best-value gap for one representative hotel product.

    Computed through the same effective-price engine the comparison page uses,
    so the dashboard headline can never disagree with that page. Illustrative
    assumptions apply exactly as they do there.
    """
    group = db.scalar(
        select(ProductGroup)
        .where(ProductGroup.category == "hotel")
        .order_by(ProductGroup.code)
    )
    if group is None:
        return None
    result = compare_offers(db, group_code=group.code)
    if not result or not result.get("offers"):
        return None

    offers = result["offers"]
    recommended = next((o for o in offers if o["id"] == result["recommended_offer_id"]), None)
    cheapest_listed = next((o for o in offers if o["id"] == result["cheapest_listed_offer_id"]), None)
    if recommended is None or cheapest_listed is None:
        return None

    listed_prices = [o["listed_price"] for o in offers]
    effective_prices = [o["effective"]["effective_price"] for o in offers]
    recommended_effective = recommended["effective"]["effective_price"]
    cheapest_effective = min(effective_prices)

    return {
        "group_code": group.code,
        "group_name": group.canonical_name,
        "city": group.city,
        "profile_key": result["profile"]["key"],
        "profile_name": result["profile"]["name"],
        "offer_count": len(offers),
        "headline_saving": round(cheapest_listed["listed_price"] - recommended["listed_price"]),
        "cheapest_listed": {
            "supplier": cheapest_listed["supplier_name"],
            "listed_price": cheapest_listed["listed_price"],
            "effective_price": cheapest_listed["effective"]["effective_price"],
        },
        "recommended": {
            "supplier": recommended["supplier_name"],
            "listed_price": recommended["listed_price"],
            "effective_price": recommended_effective,
            "fit_score": recommended["fit_score"],
        },
        "effective_gap": round(cheapest_listed["effective"]["effective_price"] - recommended_effective),
        "listed_spread": round(max(listed_prices) - min(listed_prices)),
        "effective_spread": round(max(effective_prices) - min(effective_prices)),
        "cheapest_effective_price": round(cheapest_effective),
        "offers": [
            {
                "supplier": offer["supplier_name"],
                "listed_price": offer["listed_price"],
                "effective_price": offer["effective"]["effective_price"],
                "uplift": offer["effective"]["uplift"],
                "is_recommended": offer["id"] == result["recommended_offer_id"],
                "is_cheapest_listed": offer["id"] == result["cheapest_listed_offer_id"],
            }
            for offer in sorted(offers, key=lambda o: o["effective"]["effective_price"])
        ],
        "note": (
            "Illustrative estimate computed from the synthetic demo offers and the editable "
            "assumptions in Settings. Not a market price or a guaranteed saving."
        ),
    }


def _queue_preview(db: Session, limit: int = 4) -> list[dict[str, Any]]:
    """Highest-confidence pending pairs — the next decisions a reviewer faces."""
    rows = list(
        db.scalars(
            select(MatchCandidate)
            .where(MatchCandidate.status == "pending")
            .order_by(MatchCandidate.confidence.desc())
            .limit(limit)
        ).all()
    )
    preview: list[dict[str, Any]] = []
    for candidate in rows:
        listing_a = db.get(SupplierListing, candidate.listing_a_id)
        listing_b = db.get(SupplierListing, candidate.listing_b_id)
        if listing_a is None or listing_b is None:
            continue
        preview.append(
            {
                "id": candidate.id,
                "category": candidate.category,
                "confidence": round(candidate.confidence, 3),
                "band": candidate.band,
                "listing_a": listing_a.name,
                "listing_b": listing_b.name,
                "supplier_a": listing_a.supplier.name if listing_a.supplier else "",
                "supplier_b": listing_b.supplier.name if listing_b.supplier else "",
                "conflicts": candidate.conflicts or [],
            }
        )
    return preview


def dashboard(db: Session) -> dict[str, Any]:
    suppliers = list(db.scalars(select(Supplier)).all())
    groups = list(db.scalars(select(ProductGroup)).all())
    listings = list(db.scalars(select(SupplierListing)).all())
    candidates = list(db.scalars(select(MatchCandidate)).all())

    hotel_listings = [l for l in listings if l.category == "hotel"]
    sightseeing_listings = [l for l in listings if l.category == "sightseeing"]
    pending = [c for c in candidates if c.status == "pending"]
    confirmed_groups = [g for g in groups if g.status == "confirmed"]
    multi_listing_groups = [g for g in groups if sum(1 for l in listings if l.product_group_id == g.id) > 1]

    supplier_rows = []
    for supplier in suppliers:
        supplier_listings = [l for l in listings if l.supplier_id == supplier.id]
        supplier_rows.append(
            {
                "code": supplier.code,
                "name": supplier.name,
                "accent": supplier.accent,
                "tier": supplier.tier,
                "listings": len(supplier_listings),
                "hotels": sum(1 for l in supplier_listings if l.category == "hotel"),
                "sightseeing": sum(1 for l in supplier_listings if l.category == "sightseeing"),
                "share": round(len(supplier_listings) / max(len(listings), 1) * 100, 1),
            }
        )

    metrics = [
        {
            "key": "total_listings",
            "label": "Total supplier listings",
            "value": len(listings),
            "unit": "",
            "context": f"Across {len(suppliers)} demo suppliers · {len(groups)} canonical products",
        },
        {
            "key": "duplicate_groups",
            "label": "Potential duplicate groups",
            "value": len(multi_listing_groups),
            "unit": "",
            "context": "Canonical products with more than one supplier listing",
        },
        {
            "key": "pending_reviews",
            "label": "Matches awaiting review",
            "value": len(pending),
            "unit": "",
            "context": f"{sum(1 for c in pending if c.band == 'medium')} medium · {sum(1 for c in pending if c.band == 'low')} low confidence",
        },
        {
            "key": "confirmed_groups",
            "label": "Confirmed product groups",
            "value": len(confirmed_groups),
            "unit": "",
            "context": "Reviewer-confirmed canonical products",
        },
        {
            "key": "meaningful_differences",
            "label": "Offers with meaningful differences",
            "value": _meaningful_difference_groups(db, groups, listings),
            "unit": "",
            "context": "Products whose offers differ on meals, cancellation or payment",
        },
        {
            "key": "coverage",
            "label": "Inventory coverage",
            "value": f"{len([g for g in groups if g.category == 'hotel'])} + {len([g for g in groups if g.category == 'sightseeing'])}",
            "unit": "hotels + tours",
            "context": f"{len(hotel_listings)} hotel listings · {len(sightseeing_listings)} sightseeing listings",
        },
    ]

    bands = {
        "high": sum(1 for c in candidates if c.band == "high"),
        "medium": sum(1 for c in candidates if c.band == "medium"),
        "low": sum(1 for c in candidates if c.band == "low"),
    }
    status_by_band = {
        band: {
            "approved": sum(1 for c in candidates if c.band == band and c.status == "approved"),
            "pending": sum(1 for c in candidates if c.band == band and c.status == "pending"),
            "rejected": sum(1 for c in candidates if c.band == band and c.status == "rejected"),
            "separate": sum(1 for c in candidates if c.band == band and c.status == "separate"),
        }
        for band in ("high", "medium", "low")
    }

    recent_activity = [
        {
            "id": event.id,
            "kind": event.kind,
            "actor": event.actor,
            "title": event.title,
            "detail": event.detail,
            "category": event.category,
            "created_at": event.created_at.isoformat() if event.created_at else None,
        }
        for event in db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(7)).all()
    ]

    coverage_by_city: dict[str, dict[str, int]] = {}
    for group in groups:
        bucket = coverage_by_city.setdefault(group.city, {"hotels": 0, "sightseeing": 0, "listings": 0})
        bucket["hotels" if group.category == "hotel" else "sightseeing"] += 1
        bucket["listings"] += sum(1 for l in listings if l.product_group_id == group.id)

    return {
        "metrics": metrics,
        "supplier_distribution": supplier_rows,
        "charts": {
            "supplier_distribution": supplier_rows,
            "confidence_bands": [
                {"band": band, "label": band.title(), "count": count} for band, count in bands.items()
            ],
            "category_split": [
                {"name": "Hotel inventory", "value": len(hotel_listings)},
                {"name": "Sightseeing inventory", "value": len(sightseeing_listings)},
            ],
            "match_outcomes": [
                {"band": band.title(), **status_by_band[band]} for band in ("high", "medium", "low")
            ],
            "coverage_by_city": [
                {"city": city, **counts} for city, counts in sorted(coverage_by_city.items(), key=lambda kv: -kv[1]["listings"])
            ],
        },
        "thresholds": {"high": HIGH_BAND, "medium": MEDIUM_BAND},
        "price_insight": _price_insight(db),
        "queue_preview": _queue_preview(db),
        "recent_activity": recent_activity,
        "recent_reviews": recent_reviews(db, limit=6),
        "readiness": {
            "matched_pct": round(
                sum(1 for l in listings if l.mapping_status in {"auto-matched", "confirmed"})
                / max(len(listings), 1)
                * 100
            ),
            "review_load": len(pending),
            "avg_confidence": round(
                sum(c.confidence for c in candidates) / max(len(candidates), 1), 3
            ),
        },
    }
