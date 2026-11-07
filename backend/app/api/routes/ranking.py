from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.requests import RankingRequest
from app.services.ranking_service import build_ranking

router = APIRouter(tags=["ranking"], prefix="/ranking")


@router.post("")
def rank(payload: RankingRequest, db: Session = Depends(get_db)) -> dict:
    result = build_ranking(db, payload.group_code, payload.weights, payload.equivalence_class)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Product group '{payload.group_code}' not found")
    return result
