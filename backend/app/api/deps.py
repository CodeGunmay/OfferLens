"""Shared API helpers."""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.session import get_db

DbSession = Depends(get_db)

__all__ = ["DbSession", "get_db", "Session"]
