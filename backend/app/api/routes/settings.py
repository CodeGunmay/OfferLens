from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.requests import SettingsUpdateRequest
from app.services.settings_service import summary, update_workspace

router = APIRouter(tags=["settings"], prefix="/settings")


@router.get("")
def get_settings(db: Session = Depends(get_db)) -> dict:
    return summary(db)


@router.put("")
def put_settings(payload: SettingsUpdateRequest, db: Session = Depends(get_db)) -> dict:
    updates = {key: value for key, value in payload.model_dump().items() if value is not None}
    update_workspace(db, updates)
    return summary(db)
