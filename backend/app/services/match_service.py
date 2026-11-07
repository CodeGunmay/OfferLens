"""Confidence-aware match review with a durable audit trail."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AuditEvent, MatchCandidate, ProductGroup, ReviewDecision, Supplier, SupplierListing
from app.services.serializers import group_public, listing_public

VALID_DECISIONS = {"approve", "reject", "separate", "reset"}

BAND_GUIDANCE = {
    "high": "Suitable for automatic match suggestion — still visible to reviewers.",
    "medium": "Requires human review: at least one attribute conflicts or is missing.",
    "low": "Keep listings separate. Evidence is too weak for a safe merge.",
}


def _candidate_payload(db: Session, candidate: MatchCandidate, suppliers: dict[int, Supplier]) -> dict[str, Any]:
    listing_a = db.get(SupplierListing, candidate.listing_a_id)
    listing_b = db.get(SupplierListing, candidate.listing_b_id)
    group = db.get(ProductGroup, candidate.product_group_id) if candidate.product_group_id else None
    decisions = list(
        db.scalars(
            select(ReviewDecision)
            .where(ReviewDecision.candidate_id == candidate.id)
            .order_by(ReviewDecision.id.desc())
        ).all()
    )
    same_group = bool(
        listing_a and listing_b and listing_a.product_group_id == listing_b.product_group_id
    )
    return {
        "id": candidate.id,
        "category": candidate.category,
        "confidence": candidate.confidence,
        "band": candidate.band,
        "status": candidate.status,
        "auto_suggestable": candidate.auto_suggestable,
        "summary": candidate.summary,
        "conflicts": candidate.conflicts or [],
        "missing": candidate.missing or [],
        "evidence": candidate.evidence or {},
        "guidance": BAND_GUIDANCE.get(candidate.band, ""),
        "reviewer": candidate.reviewer,
        "reviewed_at": candidate.reviewed_at.isoformat() if candidate.reviewed_at else None,
        "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
        "listing_a": listing_public(listing_a, suppliers.get(listing_a.supplier_id)) if listing_a else None,
        "listing_b": listing_public(listing_b, suppliers.get(listing_b.supplier_id)) if listing_b else None,
        "same_group": same_group,
        "proposed_group": group_public(group) if group else None,
        "decisions": [
            {
                "decision": decision.decision,
                "reviewer": decision.reviewer,
                "note": decision.note,
                "decided_at": decision.decided_at.isoformat() if decision.decided_at else None,
            }
            for decision in decisions
        ],
    }


def list_candidates(
    db: Session,
    status: str | None = None,
    band: str | None = None,
    category: str | None = None,
    search: str | None = None,
    sort: str = "confidence",
) -> dict[str, Any]:
    suppliers = {supplier.id: supplier for supplier in db.scalars(select(Supplier)).all()}

    # Counts describe the whole queue, so the tab badges stay stable while the
    # reviewer filters down to a subset.
    every_row = [
        _candidate_payload(db, candidate, suppliers)
        for candidate in db.scalars(select(MatchCandidate)).all()
    ]
    counts = {
        "all": len(every_row),
        "pending": sum(1 for row in every_row if row["status"] == "pending"),
        "approved": sum(1 for row in every_row if row["status"] == "approved"),
        "rejected": sum(1 for row in every_row if row["status"] == "rejected"),
        "separate": sum(1 for row in every_row if row["status"] == "separate"),
        "high": sum(1 for row in every_row if row["band"] == "high"),
        "medium": sum(1 for row in every_row if row["band"] == "medium"),
        "low": sum(1 for row in every_row if row["band"] == "low"),
    }

    rows = every_row
    if status and status != "all":
        rows = [row for row in rows if row["status"] == status]
    if band and band != "all":
        rows = [row for row in rows if row["band"] == band]
    if category and category != "all":
        rows = [row for row in rows if row["category"] == category]

    if search:
        needle = search.lower()
        rows = [
            row
            for row in rows
            if needle
            in (
                (row["listing_a"]["name"] if row["listing_a"] else "")
                + " "
                + (row["listing_b"]["name"] if row["listing_b"] else "")
            ).lower()
        ]

    sorters = {
        "confidence": lambda row: -row["confidence"],
        "band": lambda row: ({"high": 0, "medium": 1, "low": 2}[row["band"]], -row["confidence"]),
        "status": lambda row: (row["status"], -row["confidence"]),
        "category": lambda row: (row["category"], -row["confidence"]),
    }
    rows.sort(key=sorters.get(sort, sorters["confidence"]))

    return {"items": rows, "counts": counts, "band_guidance": BAND_GUIDANCE}


def decide(
    db: Session,
    candidate_id: int,
    decision: str,
    reviewer: str = "Demo reviewer",
    note: str = "",
) -> dict[str, Any]:
    if decision not in VALID_DECISIONS:
        raise ValueError(f"Unsupported decision '{decision}'")

    candidate = db.get(MatchCandidate, candidate_id)
    if candidate is None:
        raise LookupError("Match candidate not found")

    listing_a = db.get(SupplierListing, candidate.listing_a_id)
    listing_b = db.get(SupplierListing, candidate.listing_b_id)

    if decision == "approve":
        # Safety rule: low-confidence pairs cannot be merged from the review UI.
        if candidate.band == "low":
            raise PermissionError(
                "Low-confidence pairs cannot be approved. Keep listings separate or collect more evidence."
            )
        candidate.status = "approved"
        candidate.reviewer = reviewer
        candidate.reviewed_at = datetime.now()
        if candidate.product_group_id and listing_b is not None:
            listing_b.product_group_id = candidate.product_group_id
            listing_b.mapping_status = "confirmed"
            group = db.get(ProductGroup, candidate.product_group_id)
            if group is not None:
                group.status = "confirmed"
    elif decision == "reject":
        candidate.status = "rejected"
        candidate.reviewer = reviewer
        candidate.reviewed_at = datetime.now()
    elif decision == "separate":
        candidate.status = "separate"
        candidate.reviewer = reviewer
        candidate.reviewed_at = datetime.now()
        for listing in (listing_a, listing_b):
            if listing is not None and listing.mapping_status == "awaiting review":
                listing.mapping_status = "kept separate"
    else:  # reset
        candidate.status = "pending"
        candidate.reviewer = None
        candidate.reviewed_at = None

    db.add(
        ReviewDecision(
            candidate_id=candidate.id,
            decision=decision,
            reviewer=reviewer,
            note=note,
        )
    )
    if listing_a is not None and listing_b is not None:
        db.add(
            AuditEvent(
                kind="review",
                actor=reviewer,
                title=f"{decision.title()} match — {listing_a.name} / {listing_b.name}",
                detail=note or f"Confidence {candidate.confidence:.2f} ({candidate.band} band).",
                category=candidate.category,
                created_at=datetime.now(),
            )
        )
    db.commit()
    db.refresh(candidate)
    suppliers = {supplier.id: supplier for supplier in db.scalars(select(Supplier)).all()}
    return _candidate_payload(db, candidate, suppliers)


def recent_reviews(db: Session, limit: int = 6) -> list[dict[str, Any]]:
    decisions = list(
        db.scalars(select(ReviewDecision).order_by(ReviewDecision.id.desc()).limit(limit)).all()
    )
    rows = []
    for decision in decisions:
        candidate = db.get(MatchCandidate, decision.candidate_id)
        listing = db.get(SupplierListing, candidate.listing_a_id) if candidate else None
        rows.append(
            {
                "id": decision.id,
                "decision": decision.decision,
                "reviewer": decision.reviewer,
                "note": decision.note,
                "decided_at": decision.decided_at.isoformat() if decision.decided_at else None,
                "subject": listing.name if listing else "Unknown listing",
                "confidence": candidate.confidence if candidate else None,
                "band": candidate.band if candidate else None,
            }
        )
    return rows
