"""Seed the demo database and run the matching prototype over it.

The match candidates are *computed* by app.matching rather than hand-written, so
the confidence values shown in the UI are the real output of the prototype
scoring function (on synthetic data).
"""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.demo_data import (
    AUDIT_EVENTS,
    HOTEL_GROUPS,
    SIGHTSEEING_GROUPS,
    STANDALONE_LISTINGS,
    SUPPLIERS,
)
from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.matching.property_matcher import ListingSnapshot, run_matching
from app.models import (
    ActivityConfig,
    ActivityOffer,
    AppSetting,
    AuditEvent,
    ClientProfile,
    MatchCandidate,
    ProductGroup,
    RatePlan,
    ReviewDecision,
    RoomConfig,
    SavedRankingWeight,
    Supplier,
    SupplierListing,
    ValueAssumption,
)
from app.services.assumptions import DEFAULT_ASSUMPTIONS, DEFAULT_PROFILES, DEFAULT_RANKING_WEIGHTS

SOURCE_TYPE = "Synthetic demonstration data"
IMAGE_STATUS = "Illustrative image — source verification required"


def _create_groups(db: Session, supplier_ids: dict[str, int]) -> list[tuple[SupplierListing, str | None]]:
    """Insert product groups, listings, rooms/rates and activities/offers."""
    created: list[tuple[SupplierListing, str | None]] = []

    for category, groups in (("hotel", HOTEL_GROUPS), ("sightseeing", SIGHTSEEING_GROUPS)):
        for group_data in groups:
            group = ProductGroup(
                code=group_data["code"],
                category=category,
                canonical_name=group_data["canonical_name"],
                city=group_data["city"],
                region=group_data["region"],
                address=group_data["address"],
                star_rating=group_data["star_rating"],
                latitude=group_data["latitude"],
                longitude=group_data["longitude"],
                description=group_data["description"],
                status=group_data["status"],
                confidence=1.0,
            )
            db.add(group)
            db.flush()

            for listing_data in group_data["listings"]:
                listing = SupplierListing(
                    product_group_id=group.id,
                    supplier_id=supplier_ids[listing_data["supplier"]],
                    supplier_property_id=listing_data["supplier_property_id"],
                    name=listing_data["name"],
                    category=category,
                    address=listing_data["address"],
                    city=group_data["city"],
                    latitude=listing_data["latitude"],
                    longitude=listing_data["longitude"],
                    star_rating=listing_data["star_rating"],
                    amenities=listing_data["amenities"],
                    content_completeness=listing_data["content_completeness"],
                    source_type=SOURCE_TYPE,
                    image_status=IMAGE_STATUS,
                )
                db.add(listing)
                db.flush()
                created.append((listing, group_data["code"]))

                for room_data in listing_data.get("rooms", []):
                    room = RoomConfig(
                        listing_id=listing.id,
                        room_category=room_data["room_category"],
                        equivalence_class=room_data["equivalence_class"],
                        bed_type=room_data["bed_type"],
                        view=room_data["view"],
                        size_sqm=room_data["size_sqm"],
                        occupancy_adults=room_data["occupancy_adults"],
                        max_occupancy=room_data["max_occupancy"],
                        facilities=room_data["facilities"],
                        extraction_note=room_data["extraction_note"],
                    )
                    db.add(room)
                    db.flush()
                    for rate_data in room_data["rate_plans"]:
                        db.add(RatePlan(room_config_id=room.id, **rate_data))

                for activity_data in listing_data.get("activities", []):
                    offers = activity_data.pop("offers", [])
                    activity = ActivityConfig(listing_id=listing.id, **activity_data)
                    db.add(activity)
                    db.flush()
                    for offer_data in offers:
                        db.add(ActivityOffer(activity_config_id=activity.id, **offer_data))

    for data in STANDALONE_LISTINGS:
        listing = SupplierListing(
            product_group_id=None,
            supplier_id=supplier_ids[data["supplier"]],
            supplier_property_id=data["supplier_property_id"],
            name=data["name"],
            category=data["category"],
            address=data["address"],
            city=data["city"],
            latitude=data["latitude"],
            longitude=data["longitude"],
            star_rating=data["star_rating"],
            amenities=data["amenities"],
            content_completeness=data["content_completeness"],
            source_type=SOURCE_TYPE,
            image_status=IMAGE_STATUS,
        )
        db.add(listing)
        db.flush()
        created.append((listing, None))
        for room_data in data["rooms"]:
            room = RoomConfig(
                listing_id=listing.id,
                room_category=room_data["room_category"],
                equivalence_class=room_data["equivalence_class"],
                bed_type=room_data["bed_type"],
                view=room_data["view"],
                size_sqm=room_data["size_sqm"],
                occupancy_adults=room_data["occupancy_adults"],
                max_occupancy=room_data["max_occupancy"],
                facilities=room_data["facilities"],
                extraction_note=room_data["extraction_note"],
            )
            db.add(room)
            db.flush()
            for rate_data in room_data["rate_plans"]:
                db.add(RatePlan(room_config_id=room.id, **rate_data))

    db.flush()
    return created


def _run_matching(db: Session, created: list[tuple[SupplierListing, str | None]]) -> None:
    """Execute the matcher and persist confidence-aware review candidates."""
    listing_group = {listing.id: code for listing, code in created}
    listings = db.scalars(select(SupplierListing)).all()
    snapshots = [
        ListingSnapshot(
            id=row.id,
            name=row.name,
            city=row.city,
            address=row.address,
            latitude=row.latitude,
            longitude=row.longitude,
            star_rating=row.star_rating,
            amenities=row.amenities or [],
            category=row.category,
        )
        for row in listings
    ]

    results = run_matching(snapshots)
    now = datetime.now()
    confidence_by_listing: dict[int, float] = {}
    reviewers = ["ops.ananya", "ops.rahul", "ops.meera"]
    approved_count = 0

    for result in results:
        group_code_a = listing_group.get(result.listing_a_id)
        group_code_b = listing_group.get(result.listing_b_id)
        same_group = group_code_a is not None and group_code_a == group_code_b
        group_id = None
        if same_group:
            group = db.scalar(select(ProductGroup).where(ProductGroup.code == group_code_a))
            group_id = group.id if group else None
            for listing_id in (result.listing_a_id, result.listing_b_id):
                confidence_by_listing[listing_id] = max(
                    confidence_by_listing.get(listing_id, 0.0), result.confidence
                )

        # Business rule:
        #   * A pair inside a group a reviewer has already CONFIRMED is carried as
        #     approved (the decision is a human one, recorded in the audit trail).
        #   * A pair inside a PROPOSED group stays pending even when confidence is
        #     high — high confidence makes it auto-suggest eligible, it does not
        #     make the merge real.
        #   * A pair between listings that belong to different groups (hard
        #     negatives) stays pending and can never auto-merge.
        group_a = (
            db.scalar(select(ProductGroup).where(ProductGroup.code == group_code_a))
            if group_code_a
            else None
        )
        auto_approved = bool(same_group and group_a is not None and group_a.status == "confirmed")
        status = "approved" if auto_approved else "pending"
        reviewer = reviewers[approved_count % len(reviewers)] if auto_approved else None
        approved_count += 1

        candidate = MatchCandidate(
            listing_a_id=result.listing_a_id,
            listing_b_id=result.listing_b_id,
            product_group_id=group_id,
            category="hotel" if group_id else None,
            confidence=result.confidence,
            band=result.band,
            evidence=result.evidence,
            conflicts=result.conflicts,
            missing=result.missing,
            summary=result.summary,
            auto_suggestable=result.band == "high",
            status=status,
            reviewer=reviewer,
            reviewed_at=now - timedelta(minutes=45) if auto_approved else None,
        )
        listing_a = db.get(SupplierListing, result.listing_a_id)
        candidate.category = listing_a.category if listing_a else "hotel"
        db.add(candidate)
        db.flush()

        if auto_approved:
            db.add(
                ReviewDecision(
                    candidate_id=candidate.id,
                    decision="approve",
                    reviewer=reviewer or "Auto-rule",
                    note="High-confidence pair inside a confirmed product group.",
                    decided_at=now - timedelta(minutes=45),
                )
            )

    # Listing-level mapping bookkeeping + group confidence aggregation.
    for listing, group_code in created:
        confidence = confidence_by_listing.get(listing.id, 0.0)
        listing.match_confidence = round(confidence, 4)
        if group_code is None:
            listing.mapping_status = "unmapped"
        else:
            group = db.scalar(select(ProductGroup).where(ProductGroup.code == group_code))
            if confidence >= 0.88 and group is not None and group.status == "confirmed":
                listing.mapping_status = "auto-matched"
            else:
                listing.mapping_status = "awaiting review"

    for group in db.scalars(select(ProductGroup)).all():
        members = [l for l, code in created if code == group.code]
        scores = [m.match_confidence for m in members if m.match_confidence]
        group.confidence = round(sum(scores) / len(scores), 4) if scores else 1.0

    db.flush()


def _seed_reference_data(db: Session) -> None:
    for profile in DEFAULT_PROFILES:
        db.add(ClientProfile(**profile))
    for assumption in DEFAULT_ASSUMPTIONS:
        db.add(ValueAssumption(**assumption))
    db.add(SavedRankingWeight(name="Default model", weights=DEFAULT_RANKING_WEIGHTS))
    db.add(
        AppSetting(
            key="workspace",
            value={
                "environment": "DEMO WORKSPACE",
                "auto_match_threshold": 0.88,
                "review_threshold": 0.74,
                "default_profile": "flexible",
                "show_demo_badges": True,
                "data_source": "Synthetic demonstration dataset (see data/README.md)",
            },
        )
    )
    now = datetime.now()
    for event in AUDIT_EVENTS:
        db.add(
            AuditEvent(
                kind=event["kind"],
                actor=event["actor"],
                title=event["title"],
                detail=event["detail"],
                category=event["category"],
                created_at=now - timedelta(minutes=event["minutes_ago"]),
            )
        )
    db.flush()


def seed_database(force: bool = False) -> bool:
    """Create tables and load the demo dataset if the database is empty."""
    Base.metadata.create_all(bind=engine)
    settings = get_settings()
    if not settings.seed_on_startup and not force:
        return False

    db = SessionLocal()
    try:
        if db.scalar(select(Supplier)) and not force:
            return False
        if force:
            for model in (
                ReviewDecision,
                MatchCandidate,
                ActivityOffer,
                ActivityConfig,
                RatePlan,
                RoomConfig,
                SupplierListing,
                ProductGroup,
                AuditEvent,
                ClientProfile,
                ValueAssumption,
                SavedRankingWeight,
                AppSetting,
                Supplier,
            ):
                db.query(model).delete()
            db.commit()

        supplier_ids = {}
        for supplier_data in SUPPLIERS:
            supplier = Supplier(**supplier_data)
            db.add(supplier)
            db.flush()
            supplier_ids[supplier_data["code"]] = supplier.id

        created = _create_groups(db, supplier_ids)
        _run_matching(db, created)
        _seed_reference_data(db)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    seeded = seed_database(force="--force" in sys.argv)
    print("Seeded demo database." if seeded else "Database already contains data; skipped.")
