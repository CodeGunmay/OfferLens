"""Supplier (inventory source) model."""
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Supplier(Base):
    """A fictional demonstration inventory supplier.

    NOTE: Atlas / Meridian / Horizon are synthetic stand-ins created for this
    concept prototype. They are not real TBO partners or real suppliers.
    """

    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    tier: Mapped[str] = mapped_column(String(32), default="Direct connect")
    region: Mapped[str] = mapped_column(String(64), default="India")
    accent: Mapped[str] = mapped_column(String(16), default="#16B8A6")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    listings: Mapped[list["SupplierListing"]] = relationship(back_populates="supplier")  # noqa: F821
