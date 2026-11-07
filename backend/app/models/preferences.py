"""Client preference profiles, editable value assumptions and app settings."""
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ClientProfile(Base):
    """Weighting used by the effective-price / recommendation engine.

    Weights are percentages and must sum to 100. They express how strongly a
    client profile cares about each decision dimension.
    """

    __tablename__ = "client_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(48), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(String(200), default="")
    weights: Mapped[dict] = mapped_column(JSON, default=dict)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ValueAssumption(Base):
    """Monetary assumptions used by the effective-price model.

    Every assumption must carry an explicit source label. Where no verifiable
    source exists the `source` text says so, and the value stays editable.
    """

    __tablename__ = "value_assumptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    label: Mapped[str] = mapped_column(String(160))
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(48), default="INR")
    category: Mapped[str] = mapped_column(String(32), default="hotel")
    source: Mapped[str] = mapped_column(String(240), default="")
    is_editable: Mapped[bool] = mapped_column(Boolean, default=True)


class AppSetting(Base):
    """Simple key/value settings store (thresholds, display preferences)."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    value: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class SavedRankingWeight(Base):
    """Persisted ranking weights for the listing-page ranking model."""

    __tablename__ = "ranking_weights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), default="Default model")
    weights: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
