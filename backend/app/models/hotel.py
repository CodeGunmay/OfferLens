"""Layers 2 and 3 for hotels: room configuration and rate plan."""
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class RoomConfig(Base):
    """LAYER 2 — room configuration. Comparable rooms share an equivalence_class."""

    __tablename__ = "room_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("supplier_listings.id"), index=True)
    room_category: Mapped[str] = mapped_column(String(80), nullable=False)
    equivalence_class: Mapped[str] = mapped_column(String(64), index=True)
    bed_type: Mapped[str] = mapped_column(String(64), default="")
    view: Mapped[str] = mapped_column(String(64), default="")
    size_sqm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    occupancy_adults: Mapped[int] = mapped_column(Integer, default=2)
    max_occupancy: Mapped[int] = mapped_column(Integer, default=3)
    facilities: Mapped[list] = mapped_column(JSON, default=list)
    extraction_note: Mapped[str] = mapped_column(String(160), default="")

    listing: Mapped["SupplierListing"] = relationship(back_populates="rooms")  # noqa: F821
    rate_plans: Mapped[list["RatePlan"]] = relationship(
        back_populates="room", cascade="all, delete-orphan"
    )


class RatePlan(Base):
    """LAYER 3 — the bookable offer attached to a room configuration."""

    __tablename__ = "rate_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_config_id: Mapped[int] = mapped_column(ForeignKey("room_configs.id"), index=True)

    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    meal_plan: Mapped[str] = mapped_column(String(48), default="Room only")
    refundable: Mapped[bool] = mapped_column(Boolean, default=False)
    cancellation_deadline_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cancellation_policy_note: Mapped[str] = mapped_column(String(160), default="")
    payment_terms: Mapped[str] = mapped_column(String(48), default="Pay now")
    deposit_percent: Mapped[int] = mapped_column(Integer, default=0)
    rooms_available: Mapped[int] = mapped_column(Integer, default=4)
    valid_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    valid_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    room: Mapped["RoomConfig"] = relationship(back_populates="rate_plans")
