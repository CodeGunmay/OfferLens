"""Layers 2 and 3 for sightseeing: activity configuration and bookable offer."""
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ActivityConfig(Base):
    """LAYER 2 — what the tour actually is (duration, access, inclusions, transfers)."""

    __tablename__ = "activity_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("supplier_listings.id"), index=True)
    activity_name: Mapped[str] = mapped_column(String(160), nullable=False)
    equivalence_class: Mapped[str] = mapped_column(String(64), index=True)
    activity_type: Mapped[str] = mapped_column(String(64), default="Guided visit")
    duration_hours: Mapped[float] = mapped_column(Float, default=2.0)
    experience_type: Mapped[str] = mapped_column(String(48), default="Shared group")
    access_type: Mapped[str] = mapped_column(String(48), default="Standard entry")
    included_services: Mapped[list] = mapped_column(JSON, default=list)
    transfers: Mapped[str] = mapped_column(String(64), default="Not included")
    meeting_point: Mapped[str] = mapped_column(String(160), default="")
    languages: Mapped[list] = mapped_column(JSON, default=list)

    listing: Mapped["SupplierListing"] = relationship(back_populates="activities")  # noqa: F821
    offers: Mapped[list["ActivityOffer"]] = relationship(
        back_populates="activity", cascade="all, delete-orphan"
    )


class ActivityOffer(Base):
    """LAYER 3 — price, cancellation and availability for that activity."""

    __tablename__ = "activity_offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    activity_config_id: Mapped[int] = mapped_column(ForeignKey("activity_configs.id"), index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    price_basis: Mapped[str] = mapped_column(String(64), default="Per person")
    meals: Mapped[str] = mapped_column(String(48), default="Not included")
    access_included: Mapped[str] = mapped_column(String(48), default="Standard entry")
    cancellation_policy: Mapped[str] = mapped_column(String(48), default="Free cancellation")
    cancellation_window_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_group_size: Mapped[int] = mapped_column(Integer, default=12)
    slots_available: Mapped[int] = mapped_column(Integer, default=6)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    activity: Mapped["ActivityConfig"] = relationship(back_populates="offers")
