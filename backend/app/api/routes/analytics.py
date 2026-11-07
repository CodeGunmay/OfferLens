from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.analytics_service import analytics_payload

router = APIRouter(tags=["analytics"], prefix="/analytics")


@router.get("")
def get_analytics(db: Session = Depends(get_db)) -> dict:
    return analytics_payload(db)
