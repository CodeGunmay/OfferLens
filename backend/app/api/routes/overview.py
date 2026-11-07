from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.overview_service import dashboard

router = APIRouter(tags=["overview"], prefix="/overview")


@router.get("")
def get_overview(db: Session = Depends(get_db)) -> dict:
    payload = dashboard(db)
    payload["data_notice"] = "All metrics are DEMO DATA computed from the synthetic demonstration dataset."
    return payload
