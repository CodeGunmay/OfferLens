"""Offer intelligence: three-layer equivalence, effective price and difference cards.

LAYER 1 is resolved by the inventory service (which listings are the same product).
LAYER 2 groups comparable room / activity configurations.
LAYER 3 compares the bookable rate plans / tour offers inside one configuration.

Commercial differences are never merged away — they are surfaced and priced.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ClientProfile, ProductGroup, Supplier, SupplierListing, ValueAssumption
from app.services.effective_price import activity_effective_price, hotel_effective_price
from app.services.fit_scoring import PROFILE_DIMENSIONS, evaluate_offers
from app.services.serializers import group_public


def load_profiles(db: Session) -> list[dict[str, Any]]:
    rows = list(db.scalars(select(ClientProfile).order_by(ClientProfile.id)).all())
    return [
        {
            "key": row.key,
            "name": row.name,
            "description": row.description,
            "weights": row.weights,
            "is_default": row.is_default,
        }
        for row in rows
    ]


def load_assumptions(db: Session) -> list[dict[str, Any]]:
    rows = list(db.scalars(select(ValueAssumption).order_by(ValueAssumption.id)).all())
    return [
        {
            "key": row.key,
            "label": row.label,
            "value": row.value,
            "unit": row.unit,
            "category": row.category,
            "source": row.source,
            "is_editable": row.is_editable,
        }
        for row in rows
    ]


def assumptions_map(db: Session, overrides: dict[str, float] | None = None) -> dict[str, float]:
    values = {row["key"]: float(row["value"]) for row in load_assumptions(db)}
    for key, value in (overrides or {}).items():
        if key in values:
            values[key] = float(value)
    return values


def _members(db: Session, group: ProductGroup) -> list[SupplierListing]:
    return list(
        db.scalars(
            select(SupplierListing)
            .where(SupplierListing.product_group_id == group.id)
            .order_by(SupplierListing.id)
        ).all()
    )


def _supplier_index(db: Session) -> dict[int, str]:
    return {supplier.id: supplier.name for supplier in db.scalars(select(Supplier)).all()}


def hotel_classes(db: Session, group: ProductGroup) -> list[dict[str, Any]]:
    """Layer-2 room equivalence classes available for comparison."""
    buckets: dict[str, dict[str, Any]] = {}
    for listing in _members(db, group):
        for room in listing.rooms:
            bucket = buckets.setdefault(
                room.equivalence_class,
                {"equivalence_class": room.equivalence_class, "label": room.room_category, "suppliers": []},
            )
            bucket["suppliers"].append(listing.supplier_id)
    return sorted(
        [{**value, "supplier_count": len(set(value["suppliers"]))} for value in buckets.values()],
        key=lambda item: (-item["supplier_count"], item["label"]),
    )


def _hotel_offers(db: Session, group: ProductGroup, equivalence_class: str | None) -> tuple[list[dict[str, Any]], str | None]:
    suppliers = _supplier_index(db)
    members = _members(db, group)

    classes = [room.equivalence_class for listing in members for room in listing.rooms]
    chosen = equivalence_class if equivalence_class in classes else None
    if chosen is None and classes:
        # Default to the room class shared by the most suppliers.
        counts: dict[str, int] = {}
        for listing in members:
            for room in listing.rooms:
                counts[room.equivalence_class] = counts.get(room.equivalence_class, 0) + 1
        chosen = max(counts, key=counts.get)

    offers: list[dict[str, Any]] = []
    for listing in members:
        for room in listing.rooms:
            if room.equivalence_class != chosen:
                continue
            for plan in room.rate_plans:
                offers.append(
                    {
                        "id": f"rate-{plan.id}",
                        "supplier_name": suppliers.get(listing.supplier_id, "Unknown supplier"),
                        "supplier_code": (suppliers.get(listing.supplier_id, "") or "").replace("Supplier ", "").upper(),
                        "listing_id": listing.id,
                        "listing_name": listing.name,
                        "supplier_property_id": listing.supplier_property_id,
                        "room_category": room.room_category,
                        "bed_type": room.bed_type,
                        "view": room.view,
                        "size_sqm": room.size_sqm,
                        "occupancy_adults": room.occupancy_adults,
                        "max_occupancy": room.max_occupancy,
                        "facilities": room.facilities or [],
                        "base_price": plan.base_price,
                        "currency": plan.currency,
                        "listed_price": plan.base_price,
                        "meal_plan": plan.meal_plan,
                        "refundable": plan.refundable,
                        "cancellation_deadline_hours": plan.cancellation_deadline_hours,
                        "cancellation_policy_note": plan.cancellation_policy_note,
                        "payment_terms": plan.payment_terms,
                        "availability": plan.rooms_available,
                        "content_completeness": listing.content_completeness,
                        "match_confidence": listing.match_confidence,
                        "equivalence_class": room.equivalence_class,
                    }
                )
    return offers, chosen


def _activity_offers(db: Session, group: ProductGroup, equivalence_class: str | None) -> tuple[list[dict[str, Any]], str | None]:
    suppliers = _supplier_index(db)
    members = _members(db, group)

    classes = [activity.equivalence_class for listing in members for activity in listing.activities]
    chosen = equivalence_class if equivalence_class in classes else (classes[0] if classes else None)

    offers: list[dict[str, Any]] = []
    for listing in members:
        for activity in listing.activities:
            if activity.equivalence_class != chosen:
                continue
            for offer in activity.offers:
                offers.append(
                    {
                        "id": f"offer-{offer.id}",
                        "supplier_name": suppliers.get(listing.supplier_id, "Unknown supplier"),
                        "supplier_code": (suppliers.get(listing.supplier_id, "") or "").replace("Supplier ", "").upper(),
                        "listing_id": listing.id,
                        "listing_name": listing.name,
                        "supplier_property_id": listing.supplier_property_id,
                        "activity_name": activity.activity_name,
                        "duration_hours": activity.duration_hours,
                        "experience_type": activity.experience_type,
                        "access_type": activity.access_type,
                        "included_services": activity.included_services or [],
                        "transfers": activity.transfers,
                        "meeting_point": activity.meeting_point,
                        "languages": activity.languages or [],
                        "base_price": offer.price,
                        "listed_price": offer.price,
                        "currency": offer.currency,
                        "price_basis": offer.price_basis,
                        "meals": offer.meals,
                        "cancellation_policy": offer.cancellation_policy,
                        "cancellation_deadline_hours": offer.cancellation_window_hours,
                        "refundable": "free" in (offer.cancellation_policy or "").lower(),
                        "payment_terms": "Pay now",
                        "availability": offer.slots_available,
                        "max_group_size": offer.max_group_size,
                        "content_completeness": listing.content_completeness,
                        "match_confidence": listing.match_confidence,
                        "equivalence_class": activity.equivalence_class,
                    }
                )
    return offers, chosen


def _difference_card(
    offers: list[dict[str, Any]],
    recommended_id: int | str,
    category: str,
    labels: dict[str, str],
) -> dict[str, Any]:
    """Plain-language summary of what is identical, different, included, excluded."""

    def values_of(field: str) -> dict[str, Any]:
        return {offer["supplier_name"]: offer.get(field) for offer in offers}

    def distinct(field: str) -> bool:
        return len({str(offer.get(field)) for offer in offers}) > 1

    if category == "hotel":
        candidates = [
            ("Room category wording", "room_category"),
            ("Bed type", "bed_type"),
            ("View", "view"),
            ("Max occupancy", "max_occupancy"),
            ("Meal plan", "meal_plan"),
            ("Cancellation terms", "cancellation_policy_note"),
            ("Payment terms", "payment_terms"),
            ("Availability", "availability"),
        ]
        identical_checks = [("Room category wording", "room_category"), ("Bed type", "bed_type"), ("View", "view")]
    else:
        candidates = [
            ("Duration", "duration_hours"),
            ("Experience format", "experience_type"),
            ("Access type", "access_type"),
            ("Transfers", "transfers"),
            ("Meals", "meals"),
            ("Cancellation terms", "cancellation_policy"),
            ("Group size cap", "max_group_size"),
            ("Availability", "availability"),
        ]
        identical_checks = [("Access type", "access_type"), ("Transfers", "transfers")]

    different = [
        {"label": label, "values": values_of(field)}
        for label, field in candidates
        if distinct(field)
    ]
    identical = [
        {"label": label, "value": offers[0].get(field)}
        for label, field in identical_checks
        if not distinct(field)
    ]

    included: dict[str, list[str]] = {}
    excluded: dict[str, list[str]] = {}
    for offer in offers:
        if category == "hotel":
            inc = [offer.get("meal_plan") or "Room only"]
            if offer.get("refundable"):
                inc.append(f"Free cancellation until {offer.get('cancellation_deadline_hours')}h")
            inc.append(offer.get("payment_terms") or "")
            exc = []
            if not offer.get("refundable"):
                exc.append("Cancellation right")
            if "Room only" in (offer.get("meal_plan") or ""):
                exc.append("Breakfast")
        else:
            inc = list(offer.get("included_services") or [])
            if "included" not in (offer.get("transfers") or "").lower():
                exc = ["Transfers"]
            else:
                exc = []
            if "not included" in (offer.get("meals") or "").lower():
                exc.append("Meals")
            if "skip" not in (offer.get("access_type") or "").lower():
                exc.append("Skip-the-line access")
        included[offer["supplier_name"]] = [item for item in inc if item]
        excluded[offer["supplier_name"]] = exc

    recommended = next(offer for offer in offers if str(offer["id"]) == str(recommended_id))
    return {
        "identical": identical,
        "different": different,
        "included": included,
        "excluded": excluded,
        "recommended_supplier": recommended["supplier_name"],
        "dimension_labels": labels,
        "statement": (
            "These offers represent the same product and the same "
            + ("room configuration" if category == "hotel" else "activity configuration")
            + ". The differences below are commercial, not editorial — they are never merged away."
        ),
    }


def compare_offers(
    db: Session,
    group_code: str,
    category: str | None = None,
    equivalence_class: str | None = None,
    profile_key: str | None = None,
    custom_weights: dict[str, float] | None = None,
    assumption_overrides: dict[str, float] | None = None,
) -> dict[str, Any] | None:
    group = db.scalar(select(ProductGroup).where(ProductGroup.code == group_code))
    if group is None:
        return None
    category = category or group.category

    profiles = load_profiles(db)
    profile = next((item for item in profiles if item["key"] == profile_key), None)
    if profile is None:
        profile = next((item for item in profiles if item["is_default"]), profiles[0])

    weights = dict(profile["weights"])
    if custom_weights:
        cleaned = {
            key: max(0.0, float(value))
            for key, value in custom_weights.items()
            if key in PROFILE_DIMENSIONS
        }
        if cleaned:
            total = sum(cleaned.values())
            if total > 0:
                # Normalize to 100 so the fit score stays on a 0–100 scale.
                weights = {key: round(value / total * 100, 2) for key, value in cleaned.items()}
                for dim in PROFILE_DIMENSIONS:
                    weights.setdefault(dim, 0.0)

    assumptions = assumptions_map(db, assumption_overrides)

    if category == "hotel":
        offers, chosen_class = _hotel_offers(db, group, equivalence_class)
        classes = hotel_classes(db, group)
    else:
        offers, chosen_class = _activity_offers(db, group, equivalence_class)
        classes = [
            {"equivalence_class": activity.equivalence_class, "label": activity.activity_name, "supplier_count": 1}
            for listing in _members(db, group)
            for activity in listing.activities
        ]

    if not offers:
        return {"group": group_public(group), "offers": [], "empty": True, "classes": classes}

    weights_with_name = {**weights, "_profile_name": profile["name"]}
    evaluation = evaluate_offers(offers, weights_with_name, assumptions, category)

    card = _difference_card(evaluation["offers"], evaluation["recommended_offer_id"], category, evaluation["dimension_labels"])

    return {
        "group": group_public(group),
        "category": category,
        "equivalence_class": chosen_class,
        "classes": classes,
        "profile": profile,
        "profiles": profiles,
        "weights": evaluation["weights"],
        "dimension_labels": evaluation["dimension_labels"],
        "offers": evaluation["offers"],
        "recommended_offer_id": evaluation["recommended_offer_id"],
        "cheapest_listed_offer_id": evaluation["cheapest_listed_offer_id"],
        "cheapest_effective_offer_id": evaluation["cheapest_effective_offer_id"],
        "recommendation_reason": evaluation["recommendation_reason"],
        "cheapest_trap_note": evaluation["cheapest_trap_note"],
        "difference_card": card,
        "score_basis": evaluation["score_basis"],
        "assumptions": load_assumptions(db),
        "assumptions_used": assumptions,
        "disclaimer": (
            "Effective price is a decision-support estimate built from the assumptions listed. "
            "It is not an objective market price."
        ),
    }


def assumption_check(db: Session, key: str) -> dict[str, Any] | None:
    row = db.scalar(select(ValueAssumption).where(ValueAssumption.key == key))
    return None if row is None else {"key": row.key, "value": row.value, "source": row.source}
