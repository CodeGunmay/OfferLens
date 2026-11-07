"""Pairwise match candidates, human review decisions and the audit trail."""
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class MatchCandidate(Base):
    """A proposed equivalence between two supplier listings.

    Confidence bands:
      high   (>= HIGH threshold)   -> suitable for automatic match suggestion
      medium (>= MEDIUM threshold) -> requires human review
      low    (<  MEDIUM threshold) -> keep listings separate
    """

    __tablename__ = "match_candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    listing_a_id: Mapped[int] = mapped_column(ForeignKey("supplier_listings.id"), index=True)
    listing_b_id: Mapped[int] = mapped_column(ForeignKey("supplier_listings.id"), index=True)
    product_group_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_groups.id"), nullable=True
    )
    category: Mapped[str] = mapped_column(String(24), default="hotel")

    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    band: Mapped[str] = mapped_column(String(16), default="low")
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)
    conflicts: Mapped[list] = mapped_column(JSON, default=list)
    missing: Mapped[list] = mapped_column(JSON, default=list)
    summary: Mapped[str] = mapped_column(Text, default="")
    auto_suggestable: Mapped[bool] = mapped_column(Boolean, default=False)

    status: Mapped[str] = mapped_column(String(24), default="pending")  # pending|approved|rejected|separate
    reviewer: Mapped[str | None] = mapped_column(String(80), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    decisions: Mapped[list["ReviewDecision"]] = relationship(
        back_populates="candidate", cascade="all, delete-orphan", order_by="ReviewDecision.id"
    )


class ReviewDecision(Base):
    """Append-only record of a human review action (audit trail)."""

    __tablename__ = "review_decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("match_candidates.id"), index=True)
    decision: Mapped[str] = mapped_column(String(24))
    reviewer: Mapped[str] = mapped_column(String(80), default="Demo reviewer")
    note: Mapped[str] = mapped_column(String(240), default="")
    decided_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    candidate: Mapped["MatchCandidate"] = relationship(back_populates="decisions")


class AuditEvent(Base):
    """Activity feed covering batch matching runs and review actions."""

    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String(32), index=True)  # match_run | review | enrichment
    actor: Mapped[str] = mapped_column(String(80), default="Matching batch job")
    title: Mapped[str] = mapped_column(String(200), default="")
    detail: Mapped[str] = mapped_column(String(240), default="")
    category: Mapped[str] = mapped_column(String(24), default="hotel")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
