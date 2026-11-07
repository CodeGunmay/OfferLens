from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import ClientProfile, ValueAssumption
from app.schemas.requests import AssumptionUpdateRequest, CompareRequest, ProfileUpdateRequest
from app.services.offer_service import compare_offers, load_assumptions, load_profiles, PROFILE_DIMENSIONS

router = APIRouter(tags=["offers"], prefix="/offers")


@router.post("/compare")
def compare(payload: CompareRequest, db: Session = Depends(get_db)) -> dict:
    result = compare_offers(
        db,
        group_code=payload.group_code,
        category=payload.category,
        equivalence_class=payload.equivalence_class,
        profile_key=payload.profile_key,
        custom_weights=payload.weights,
        assumption_overrides=payload.assumptions,
    )
    if result is None:
        raise HTTPException(status_code=404, detail=f"Product group '{payload.group_code}' not found")
    return result


@router.get("/profiles")
def profiles(db: Session = Depends(get_db)) -> dict:
    return {
        "profiles": load_profiles(db),
        "assumptions": load_assumptions(db),
        "dimensions": list(PROFILE_DIMENSIONS),
    }


@router.put("/profiles/{key}")
def update_profile(key: str, payload: ProfileUpdateRequest, db: Session = Depends(get_db)) -> dict:
    profile = db.scalar(select(ClientProfile).where(ClientProfile.key == key))
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Profile '{key}' not found")
    total = sum(payload.weights.values())
    profile.weights = {dim: round(payload.weights.get(dim, 0) / total * 100, 2) for dim in PROFILE_DIMENSIONS}
    db.commit()
    return {"key": profile.key, "name": profile.name, "weights": profile.weights}


@router.put("/assumptions/{key}")
def update_assumption(key: str, payload: AssumptionUpdateRequest, db: Session = Depends(get_db)) -> dict:
    assumption = db.scalar(select(ValueAssumption).where(ValueAssumption.key == key))
    if assumption is None:
        raise HTTPException(status_code=404, detail=f"Assumption '{key}' not found")
    if not assumption.is_editable:
        raise HTTPException(status_code=409, detail="This assumption is locked")
    assumption.value = payload.value
    db.commit()
    return {"key": assumption.key, "label": assumption.label, "value": assumption.value, "unit": assumption.unit, "source": assumption.source}
