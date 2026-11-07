"""Export the seeded demo dataset to JSON for review / dataset provenance.

Usage:  python -m scripts.export_demo_data
Writes: ../data/synthetic/offerlens_demo_dataset.json
"""
from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select

from app.database.seed import seed_database
from app.database.session import SessionLocal
from app.models import (
    ActivityConfig,
    ActivityOffer,
    MatchCandidate,
    ProductGroup,
    RatePlan,
    RoomConfig,
    Supplier,
    SupplierListing,
)

OUTPUT = Path(__file__).resolve().parents[2] / "data" / "synthetic" / "offerlens_demo_dataset.json"


def main() -> None:
    seed_database()
    db = SessionLocal()
    try:
        suppliers = {s.id: s for s in db.scalars(select(Supplier)).all()}
        payload = {
            "provenance": {
                "dataset": "OfferLens synthetic demonstration dataset",
                "license": "MIT (code) / CC0-style synthetic records",
                "notes": [
                    "Supplier names (Atlas, Meridian, Horizon), property IDs, prices and rate plans are synthetic.",
                    "This is not TBO inventory and must not be represented as such.",
                    "Attraction and city names are real-world anchors; coordinates are approximate.",
                ],
            },
            "suppliers": [
                {"code": s.code, "name": s.name, "tier": s.tier} for s in suppliers.values()
            ],
            "product_groups": [],
            "match_candidates": [],
        }

        for group in db.scalars(select(ProductGroup).order_by(ProductGroup.code)).all():
            group_payload = {
                "code": group.code,
                "category": group.category,
                "canonical_name": group.canonical_name,
                "city": group.city,
                "region": group.region,
                "address": group.address,
                "star_rating": group.star_rating,
                "latitude": group.latitude,
                "longitude": group.longitude,
                "status": group.status,
                "description": group.description,
                "listings": [],
            }
            listings = db.scalars(
                select(SupplierListing).where(SupplierListing.product_group_id == group.id)
            ).all()
            for listing in listings:
                group_payload["listings"].append(
                    {
                        "supplier": suppliers[listing.supplier_id].name,
                        "supplier_property_id": listing.supplier_property_id,
                        "name": listing.name,
                        "address": listing.address,
                        "latitude": listing.latitude,
                        "longitude": listing.longitude,
                        "star_rating": listing.star_rating,
                        "amenities": listing.amenities,
                        "content_completeness": listing.content_completeness,
                        "match_confidence": listing.match_confidence,
                        "rooms": [
                            {
                                "room_category": room.room_category,
                                "equivalence_class": room.equivalence_class,
                                "bed_type": room.bed_type,
                                "view": room.view,
                                "max_occupancy": room.max_occupancy,
                                "rate_plans": [
                                    {
                                        "base_price": plan.base_price,
                                        "meal_plan": plan.meal_plan,
                                        "refundable": plan.refundable,
                                        "cancellation_deadline_hours": plan.cancellation_deadline_hours,
                                        "payment_terms": plan.payment_terms,
                                        "rooms_available": plan.rooms_available,
                                    }
                                    for plan in db.scalars(
                                        select(RatePlan).where(RatePlan.room_config_id == room.id)
                                    ).all()
                                ],
                            }
                            for room in db.scalars(
                                select(RoomConfig).where(RoomConfig.listing_id == listing.id)
                            ).all()
                        ],
                        "activities": [
                            {
                                "activity_name": activity.activity_name,
                                "equivalence_class": activity.equivalence_class,
                                "duration_hours": activity.duration_hours,
                                "experience_type": activity.experience_type,
                                "access_type": activity.access_type,
                                "transfers": activity.transfers,
                                "included_services": activity.included_services,
                                "offers": [
                                    {
                                        "price": offer.price,
                                        "meals": offer.meals,
                                        "cancellation_policy": offer.cancellation_policy,
                                        "max_group_size": offer.max_group_size,
                                        "slots_available": offer.slots_available,
                                    }
                                    for offer in db.scalars(
                                        select(ActivityOffer).where(
                                            ActivityOffer.activity_config_id == activity.id
                                        )
                                    ).all()
                                ],
                            }
                            for activity in db.scalars(
                                select(ActivityConfig).where(ActivityConfig.listing_id == listing.id)
                            ).all()
                        ],
                    }
                )
            payload["product_groups"].append(group_payload)

        for candidate in db.scalars(select(MatchCandidate)).all():
            payload["match_candidates"].append(
                {
                    "listing_a_id": candidate.listing_a_id,
                    "listing_b_id": candidate.listing_b_id,
                    "category": candidate.category,
                    "confidence": candidate.confidence,
                    "band": candidate.band,
                    "status": candidate.status,
                    "evidence": candidate.evidence,
                    "conflicts": candidate.conflicts,
                    "missing": candidate.missing,
                }
            )

        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps(payload, indent=2) + "\n")
        print(f"Wrote {OUTPUT.relative_to(OUTPUT.parents[2])} ({OUTPUT.stat().st_size / 1024:.1f} KB)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
