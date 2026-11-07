from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.requests import DecisionRequest
from app.services.match_service import decide, list_candidates

router = APIRouter(tags=["matches"], prefix="/matches")


@router.get("")
def get_matches(
    status: str = "all",
    band: str = "all",
    category: str = "all",
    search: str | None = None,
    sort: str = Query("confidence", pattern="^(confidence|band|status|category)$"),
    db: Session = Depends(get_db),
) -> dict:
    return list_candidates(db, status=status, band=band, category=category, search=search, sort=sort)


@router.post("/{candidate_id}/decision")
def post_decision(candidate_id: int, payload: DecisionRequest, db: Session = Depends(get_db)) -> dict:
    try:
        return decide(
            db,
            candidate_id=candidate_id,
            decision=payload.decision,
            reviewer=payload.reviewer,
            note=payload.note,
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
