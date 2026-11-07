"""Inventory reads: hotel and sightseeing inventory plus layer-1 explanation."""
from __future__ import annotations

from statistics import mean
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.matching.amenities import canonical_set, label_for, normalized_amenities
from app.matching.property_matcher import ListingSnapshot, score_pair
from app.models import MatchCandidate, ProductGroup, Supplier, SupplierListing
from app.services.serializers import group_public, group_summary, listing_public, min_price, room_public


def _query_listings(db: Session, category: str) -> list[SupplierListing]:
    return list(
        db.scalars(
            select(SupplierListing)
            .where(SupplierListing.category == category)
            .options(
                selectinload(SupplierListing.rooms),
                selectinload(SupplierListing.activities),
            )
            .order_by(SupplierListing.id)
        )
    )


def supplier_index(db: Session) -> dict[int, Supplier]:
    return {supplier.id: supplier for supplier in db.scalars(select(Supplier)).all()}


def _grouped(db: Session, category: str) -> tuple[list[ProductGroup], list[SupplierListing], dict[int, Supplier]]:
    groups = list(
        db.scalars(select(ProductGroup).where(ProductGroup.category == category).order_by(ProductGroup.id))
    )
    listings = _query_listings(db, category)
    return groups, listings, supplier_index(db)


def list_groups(
    db: Session,
    category: str,
    search: str | None = None,
    city: str | None = None,
    supplier_code: str | None = None,
    status: str | None = None,
    sort: str = "confidence",
) -> dict[str, Any]:
    """Group-level inventory with filters + sorting."""
    groups, listings, suppliers = _grouped(db, category)
    by_group: dict[int, list[SupplierListing]] = {}
    for listing in listings:
        if listing.product_group_id:
            by_group.setdefault(listing.product_group_id, []).append(listing)

    rows = []
    for group in groups:
        members = by_group.get(group.id, [])
        if supplier_code and supplier_code != "all":
            members = [
                m for m in members if suppliers[m.supplier_id].code == supplier_code
                if m.supplier_id in suppliers
            ]
        if search:
            needle = search.lower()
            haystack = (group.canonical_name + " " + group.city + " " + " ".join(m.name for m in members)).lower()
            if needle not in haystack:
                continue
        if city and city != "all" and group.city != city:
            continue
        if status and status != "all" and group.status != status:
            continue
        rows.append(group_summary(group, members or by_group.get(group.id, []), suppliers))

    sorters = {
        "confidence": lambda row: -row["confidence"],
        "name": lambda row: row["canonical_name"],
        "city": lambda row: (row["city"], row["canonical_name"]),
        "listings": lambda row: -row["listing_count"],
        "price": lambda row: row["price_from"] or 0,
    }
    rows.sort(key=sorters.get(sort, sorters["confidence"]))

    return {
        "items": rows,
        "filters": {
            "cities": sorted({group.city for group in groups}),
            "statuses": ["confirmed", "proposed"],
            "suppliers": [{"code": s.code, "name": s.name} for s in suppliers.values()],
        },
        "total": len(rows),
        "category": category,
    }


def _agreement_table(listings: list[SupplierListing], suppliers: dict[int, Supplier]) -> list[dict[str, Any]]:
    """Attribute-by-attribute comparison across supplier listings."""
    stars = {suppliers[l.supplier_id].name: l.star_rating for l in listings if l.supplier_id in suppliers}
    known_stars = [v for v in stars.values() if v is not None]
    star_status = "missing" if not known_stars else ("match" if len(set(known_stars)) == 1 else "conflict")

    shared = canonical_set(listings[0].amenities) if listings else set()
    for listing in listings[1:]:
        shared &= canonical_set(listing.amenities)
    all_amenities = set()
    for listing in listings:
        all_amenities |= canonical_set(listing.amenities)

    return [
        {
            "attribute": "Star rating",
            "values": [{"supplier": name, "value": v} for name, v in stars.items()],
            "status": star_status,
            "note": "" if star_status == "match" else "Suppliers publish different star classes.",
        },
        {
            "attribute": "Amenities",
            "values": [
                {
                    "supplier": suppliers[l.supplier_id].name if l.supplier_id in suppliers else "Unknown",
                    "value": len(canonical_set(l.amenities)),
                }
                for l in listings
            ],
            "status": "match" if len(shared) == len(all_amenities) else "partial",
            "note": f"{len(shared)} amenities agreed by all suppliers; {len(all_amenities) - len(shared)} appear in some feeds only.",
            "shared": sorted(label_for(key) for key in shared),
            "partial": sorted(label_for(key) for key in all_amenities - shared),
        },
        {
            "attribute": "Coordinates",
            "values": [
                {
                    "supplier": suppliers[l.supplier_id].name if l.supplier_id in suppliers else "Unknown",
                    "value": f"{l.latitude:.4f}, {l.longitude:.4f}",
                }
                for l in listings
            ],
            "status": "match",
            "note": "All listings fall inside the 200 m geo-block used by the matcher.",
        },
        {
            "attribute": "Address",
            "values": [
                {"supplier": suppliers[l.supplier_id].name if l.supplier_id in suppliers else "Unknown", "value": l.address}
                for l in listings
            ],
            "status": "partial",
            "note": "Addresses are written differently; normalized tokens agree on street and locality.",
        },
    ]


def _pairwise_evidence(listings: list[SupplierListing], suppliers: dict[int, Supplier]) -> list[dict[str, Any]]:
    """Run the layer-1 matcher on every pair inside a group and explain it."""
    snapshots = {
        listing.id: ListingSnapshot(
            id=listing.id,
            name=listing.name,
            city=listing.city,
            address=listing.address,
            latitude=listing.latitude,
            longitude=listing.longitude,
            star_rating=listing.star_rating,
            amenities=listing.amenities or [],
            category=listing.category,
        )
        for listing in listings
    }
    index = {listing.id: listing for listing in listings}
    results = []
    for i, first in enumerate(listings):
        for second in listings[i + 1:]:
            result = score_pair(snapshots[first.id], snapshots[second.id])
            results.append(
                {
                    "listing_a_id": first.id,
                    "listing_b_id": second.id,
                    "listing_a_name": first.name,
                    "listing_b_name": second.name,
                    "supplier_a": suppliers[first.supplier_id].name if first.supplier_id in suppliers else "",
                    "supplier_b": suppliers[second.supplier_id].name if second.supplier_id in suppliers else "",
                    "confidence": result.confidence,
                    "band": result.band,
                    "evidence": result.evidence,
                    "conflicts": result.conflicts,
                    "missing": result.missing,
                    "summary": result.summary,
                }
            )
    del index
    return results


def _room_classes(listings: list[SupplierListing], suppliers: dict[int, Supplier]) -> list[dict[str, Any]]:
    buckets: dict[str, list[dict[str, Any]]] = {}
    for listing in listings:
        for room in listing.rooms:
            buckets.setdefault(room.equivalence_class, []).append(
                {
                    "listing_id": listing.id,
                    "supplier": suppliers[listing.supplier_id].name if listing.supplier_id in suppliers else "",
                    "supplier_code": suppliers[listing.supplier_id].code if listing.supplier_id in suppliers else "",
                    "supplier_accent": suppliers[listing.supplier_id].accent if listing.supplier_id in suppliers else "#64748B",
                    **room_public(room),
                }
            )

    classes = []
    for equivalence_class, entries in buckets.items():
        beds = {entry["bed_type"] for entry in entries}
        views = {entry["view"] for entry in entries}
        occupancies = {entry["max_occupancy"] for entry in entries}
        sizes = [entry["size_sqm"] for entry in entries if entry["size_sqm"]]
        differences = []
        if len(beds) > 1:
            differences.append("Bed type wording differs: " + " / ".join(sorted(beds)))
        if len(views) > 1:
            differences.append("View wording differs: " + " / ".join(sorted(views)))
        if len(occupancies) > 1:
            differences.append(f"Max occupancy differs ({min(occupancies)}–{max(occupancies)} guests)")
        if sizes and max(sizes) - min(sizes) >= 3:
            differences.append(f"Room size ranges {min(sizes)}–{max(sizes)} m²")

        classes.append(
            {
                "equivalence_class": equivalence_class,
                "label": entries[0]["room_category"],
                "supplier_count": len(entries),
                "entries": entries,
                "differences": differences,
                "comparable": len(entries) > 1,
                "occupancy_range": [min(occupancies), max(occupancies)] if occupancies else [],
            }
        )
    classes.sort(key=lambda item: (-item["supplier_count"], item["label"]))
    return classes


def group_detail(db: Session, code: str) -> dict[str, Any] | None:
    group = db.scalar(select(ProductGroup).where(ProductGroup.code == code))
    if group is None:
        return None
    suppliers = supplier_index(db)
    listings = _query_listings(db, group.category)
    members = [listing for listing in listings if listing.product_group_id == group.id]

    candidates = list(
        db.scalars(select(MatchCandidate).where(MatchCandidate.product_group_id == group.id)).all()
    )

    payload: dict[str, Any] = {
        "group": group_public(group),
        "summary": group_summary(group, members, suppliers),
        "listings": [listing_public(listing, suppliers.get(listing.supplier_id)) for listing in members],
        "identity_evidence": _pairwise_evidence(members, suppliers),
        "agreement": _agreement_table(members, suppliers),
        "room_classes": _room_classes(members, suppliers),
        "candidates": [
            {
                "id": candidate.id,
                "confidence": candidate.confidence,
                "band": candidate.band,
                "status": candidate.status,
                "summary": candidate.summary,
                "conflicts": candidate.conflicts,
                "missing": candidate.missing,
            }
            for candidate in candidates
        ],
        "price_band": {
            "from": min([p for p in (min_price(l) for l in members) if p is not None], default=None),
            "to": max([p for p in (min_price(l) for l in members) if p is not None], default=None),
        },
        "avg_confidence": round(mean([l.match_confidence for l in members]), 4) if members else 0.0,
    }

    if group.category == "sightseeing":
        payload["activity_classes"] = _activity_classes(members, suppliers)

    return payload


def _activity_classes(listings: list[SupplierListing], suppliers: dict[int, Supplier]) -> list[dict[str, Any]]:
    buckets: dict[str, list[dict[str, Any]]] = {}
    for listing in listings:
        for activity in listing.activities:
            buckets.setdefault(activity.equivalence_class, []).append(
                {
                    "listing_id": listing.id,
                    "supplier": suppliers[listing.supplier_id].name if listing.supplier_id in suppliers else "",
                    "supplier_code": suppliers[listing.supplier_id].code if listing.supplier_id in suppliers else "",
                    "supplier_accent": suppliers[listing.supplier_id].accent if listing.supplier_id in suppliers else "#64748B",
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
                        }
                        for offer in activity.offers
                    ],
                }
            )

    classes = []
    for equivalence_class, entries in buckets.items():
        durations = {entry["duration_hours"] for entry in entries}
        transfers = {entry["transfers"] for entry in entries}
        access = {entry["access_type"] for entry in entries}
        differences = []
        if len(durations) > 1:
            differences.append(
                "Duration differs: " + ", ".join(f"{d:g}h" for d in sorted(durations))
            )
        if len(transfers) > 1:
            differences.append("Transfers differ between suppliers")
        if len(access) > 1:
            differences.append("Access type differs (" + " vs ".join(sorted(access)) + ")")
        if len({entry["experience_type"] for entry in entries}) > 1:
            differences.append("Group format differs (private / small group / shared)")

        classes.append(
            {
                "equivalence_class": equivalence_class,
                "label": entries[0]["activity_name"],
                "supplier_count": len(entries),
                "entries": entries,
                "differences": differences,
                "comparable": True,
            }
        )
    return classes


def content_consolidation(db: Session, category: str) -> list[dict[str, Any]]:
    """Content Enrichment: normalized name, merged amenities and conflicts per group."""
    groups, listings, suppliers = _grouped(db, category)
    rows = []
    for group in groups:
        members = [listing for listing in listings if listing.product_group_id == group.id]
        if not members:
            continue
        all_amenities: set[str] = set()
        agreed: set[str] | None = None
        for listing in members:
            keys = canonical_set(listing.amenities)
            all_amenities |= keys
            agreed = keys if agreed is None else agreed & keys

        conflicts = []
        stars = {suppliers[m.supplier_id].name: m.star_rating for m in members if m.supplier_id in suppliers}
        if len({v for v in stars.values() if v is not None}) > 1:
            conflicts.append(
                "Star rating: " + ", ".join(f"{name} = {value:g}★" for name, value in stars.items() if value is not None)
            )
        descriptions = [m.address for m in members if m.address]
        if len({d.lower() for d in descriptions}) > 1:
            conflicts.append("Address formats differ between suppliers")

        rows.append(
            {
                "group": group_public(group),
                "supplier_names": [
                    {
                        "supplier": suppliers[m.supplier_id].name if m.supplier_id in suppliers else "",
                        "supplier_property_id": m.supplier_property_id,
                        "name": m.name,
                        "content_completeness": m.content_completeness,
                        "image_status": m.image_status,
                    }
                    for m in members
                ],
                "consolidated_name": group.canonical_name,
                "verified_amenities": sorted(label_for(key) for key in (agreed or set())),
                "additional_amenities": sorted(label_for(key) for key in all_amenities - (agreed or set())),
                "amenity_mapping": [
                    {"supplier": suppliers[m.supplier_id].name if m.supplier_id in suppliers else "", "items": normalized_amenities(m.amenities)}
                    for m in members
                ],
                "conflicts": conflicts,
                "missing": [
                    f"{suppliers[m.supplier_id].name}: room size not published"
                    for m in members
                    for room in m.rooms
                    if room.size_sqm is None
                ][:3],
                "completeness": round(sum(m.content_completeness for m in members) / len(members)),
                "image_status": members[0].image_status,
                "source_type": members[0].source_type,
            }
        )
    return rows
