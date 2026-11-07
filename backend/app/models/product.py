"""Layer 1 of the OfferLens equivalence model: product / property identity."""
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ProductGroup(Base):
    """A canonical hotel property or sightseeing product.

    Listings from several suppliers can resolve to one canonical product, but
    the canonical product never absorbs commercial differences: room /
    activity configuration and rate plans stay attached to each listing.
    """

    __tablename__ = "product_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(24), index=True)  # hotel | sightseeing
    canonical_name: Mapped[str] = mapped_column(String(160), nullable=False)
    city: Mapped[str] = mapped_column(String(80), index=True)
    region: Mapped[str] = mapped_column(String(80), default="")
    country: Mapped[str] = mapped_column(String(64), default="India")
    address: Mapped[str] = mapped_column(String(240), default="")
    star_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(24), default="confirmed")  # confirmed | proposed
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    listings: Mapped[list["SupplierListing"]] = relationship(
        back_populates="product_group", cascade="all, delete-orphan"
    )


class SupplierListing(Base):
    """One supplier's representation of a product (its own name, ID and content)."""

    __tablename__ = "supplier_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_group_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_groups.id"), nullable=True, index=True
    )
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)

    supplier_property_id: Mapped[str] = mapped_column(String(48), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(24), index=True)
    address: Mapped[str] = mapped_column(String(240), default="")
    city: Mapped[str] = mapped_column(String(80), index=True)
    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)
    star_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    amenities: Mapped[list] = mapped_column(JSON, default=list)

    # Matching bookkeeping (illustrative values produced by the prototype matcher)
    match_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    mapping_status: Mapped[str] = mapped_column(String(32), default="unreviewed")
    content_completeness: Mapped[int] = mapped_column(Integer, default=0)
    image_status: Mapped[str] = mapped_column(
        String(80), default="Illustrative image — source verification required"
    )
    source_type: Mapped[str] = mapped_column(String(64), default="Synthetic demonstration data")
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    supplier: Mapped["Supplier"] = relationship(back_populates="listings")  # noqa: F821
    product_group: Mapped["ProductGroup | None"] = relationship(back_populates="listings")
    rooms: Mapped[list["RoomConfig"]] = relationship(  # noqa: F821
        back_populates="listing", cascade="all, delete-orphan"
    )
    activities: Mapped[list["ActivityConfig"]] = relationship(  # noqa: F821
        back_populates="listing", cascade="all, delete-orphan"
    )
