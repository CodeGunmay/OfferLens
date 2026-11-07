"""Serializers shared by the API layer.

Kept separate from ORM models so response shapes stay stable even if storage
changes, and so business logic never has to know about HTTP.
"""
from datetime import date, datetime
from typing import Any

from app.models import ActivityConfig, RatePlan, RoomConfig, SupplierListing, Supplier


def iso(value: datetime | date | None) -> str | None:
    return value.isoformat() if value else None


def room_public(room: RoomConfig) -> dict[str, Any]:
    return {
        "id": room.id,
        "room_category": room.room_category,
        "equivalence_class": room.equivalence_class,
        "bed_type": room.bed_type,
        "view": room.view,
        "size_sqm": room.size_sqm,
        "occupancy_adults": room.occupancy_adults,
        "max_occupancy": room.max_occupancy,
        "facilities": room.facilities or [],
        "extraction_note": room.extraction_note,
        "rate_plans": [rate_plan_public(plan) for plan in room.rate_plans],
    }


def rate_plan_public(plan: RatePlan) -> dict[str, Any]:
    return {
        "id": plan.id,
        "base_price": plan.base_price,
        "currency": plan.currency,
        "meal_plan": plan.meal_plan,
        "refundable": plan.refundable,
        "cancellation_deadline_hours": plan.cancellation_deadline_hours,
        "cancellation_policy_note": plan.cancellation_policy_note,
        "payment_terms": plan.payment_terms,
        "deposit_percent": plan.deposit_percent,
        "rooms_available": plan.rooms_available,
        "updated_at": iso(plan.updated_at),
    }


def activity_public(activity: ActivityConfig) -> dict[str, Any]:
    return {
        "id": activity.id,
        "activity_name": activity.activity_name,
        "equivalence_class": activity.equivalence_class,
        "activity_type": activity.activity_type,
        "duration_hours": activity.duration_hours,
        "experience_type": activity.experience_type,
        "access_type": activity.access_type,
        "included_services": activity.included_services or [],
        "transfers": activity.transfers,
        "meeting_point": activity.meeting_point,
        "languages": activity.languages or [],
        "offers": [
            {
                "id": offer.id,
                "price": offer.price,
                "currency": offer.currency,
                "price_basis": offer.price_basis,
                "meals": offer.meals,
                "access_included": offer.access_included,
                "cancellation_policy": offer.cancellation_policy,
                "cancellation_window_hours": offer.cancellation_window_hours,
                "max_group_size": offer.max_group_size,
                "slots_available": offer.slots_available,
                "updated_at": iso(offer.updated_at),
            }
            for offer in activity.offers
        ],
    }


def listing_public(listing: SupplierListing, supplier: Supplier | None) -> dict[str, Any]:
    return {
        "id": listing.id,
        "supplier_id": listing.supplier_id,
        "supplier_code": supplier.code if supplier else "",
        "supplier_name": supplier.name if supplier else "Unknown supplier",
        "supplier_accent": supplier.accent if supplier else "#64748B",
        "supplier_property_id": listing.supplier_property_id,
        "name": listing.name,
        "category": listing.category,
        "address": listing.address,
        "city": listing.city,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "star_rating": listing.star_rating,
        "amenities": listing.amenities or [],
        "match_confidence": listing.match_confidence,
        "mapping_status": listing.mapping_status,
        "content_completeness": listing.content_completeness,
        "image_status": listing.image_status,
        "source_type": listing.source_type,
        "updated_at": iso(listing.updated_at),
        "rooms": [room_public(room) for room in listing.rooms],
        "activities": [activity_public(activity) for activity in listing.activities],
    }


def group_public(group) -> dict[str, Any]:
    return {
        "id": group.id,
        "code": group.code,
        "category": group.category,
        "canonical_name": group.canonical_name,
        "city": group.city,
        "region": group.region,
        "country": group.country,
        "address": group.address,
        "star_rating": group.star_rating,
        "latitude": group.latitude,
        "longitude": group.longitude,
        "description": group.description,
        "status": group.status,
        "confidence": group.confidence,
    }


def min_price(listing: SupplierListing) -> float | None:
    prices = [
        plan.base_price for room in listing.rooms for plan in room.rate_plans
    ] + [offer.price for activity in listing.activities for offer in activity.offers]
    return min(prices) if prices else None


def group_summary(group, listings: list[SupplierListing], suppliers: dict[int, Supplier]) -> dict[str, Any]:
    prices = [p for p in (min_price(listing) for listing in listings) if p is not None]
    return {
        **group_public(group),
        "listing_count": len(listings),
        "suppliers": [
            {
                "code": suppliers[listing.supplier_id].code,
                "name": suppliers[listing.supplier_id].name,
                "accent": suppliers[listing.supplier_id].accent,
            }
            for listing in listings
            if listing.supplier_id in suppliers
        ],
        "price_from": min(prices) if prices else None,
        "price_to": max(prices) if prices else None,
        "mapping_statuses": sorted({listing.mapping_status for listing in listings}),
        "avg_content_completeness": round(
            sum(listing.content_completeness for listing in listings) / max(len(listings), 1)
        ),
    }
