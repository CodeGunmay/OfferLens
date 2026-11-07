"""Workspace settings and review thresholds."""
from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.matching.property_matcher import HIGH_BAND, MEDIUM_BAND
from app.models import AppSetting, ClientProfile, ValueAssumption

DEFAULT_WORKSPACE = {
    "environment": "DEMO WORKSPACE",
    "auto_match_threshold": HIGH_BAND,
    "review_threshold": MEDIUM_BAND,
    "default_profile": "flexible",
    "show_demo_badges": True,
    "data_source": "Synthetic demonstration dataset (see data/README.md)",
}


def get_workspace(db: Session) -> dict[str, Any]:
    row = db.scalar(select(AppSetting).where(AppSetting.key == "workspace"))
    value = dict(DEFAULT_WORKSPACE)
    if row and isinstance(row.value, dict):
        value.update(row.value)
    return value


def update_workspace(db: Session, updates: dict[str, Any]) -> dict[str, Any]:
    row = db.scalar(select(AppSetting).where(AppSetting.key == "workspace"))
    if row is None:
        row = AppSetting(key="workspace", value=dict(DEFAULT_WORKSPACE))
        db.add(row)
    merged = dict(row.value or {})
    for key, value in updates.items():
        if key in DEFAULT_WORKSPACE:
            merged[key] = value
    row.value = merged
    db.commit()
    return get_workspace(db)


def summary(db: Session) -> dict[str, Any]:
    profiles = list(db.scalars(select(ClientProfile).order_by(ClientProfile.id)).all())
    assumptions = list(db.scalars(select(ValueAssumption).order_by(ValueAssumption.id)).all())
    return {
        "workspace": get_workspace(db),
        "profiles": [
            {"key": p.key, "name": p.name, "description": p.description, "weights": p.weights, "is_default": p.is_default}
            for p in profiles
        ],
        "assumptions": [
            {
                "key": a.key,
                "label": a.label,
                "value": a.value,
                "unit": a.unit,
                "category": a.category,
                "source": a.source,
                "is_editable": a.is_editable,
            }
            for a in assumptions
        ],
        "thresholds": {"high": HIGH_BAND, "medium": MEDIUM_BAND},
        "data_notice": (
            "This workspace runs on synthetic demonstration data. Supplier names, property IDs and "
            "prices are illustrative and are not TBO inventory."
        ),
    }
