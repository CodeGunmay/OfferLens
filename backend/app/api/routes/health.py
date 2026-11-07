from fastapi import APIRouter
from sqlalchemy import func, select

from app.config import get_settings
from app.database.session import SessionLocal
from app.models.matching import MatchCandidate
from app.models.product import ProductGroup, SupplierListing

router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict:
    """Liveness + readiness probe.

    `database_ok` and the counts let a deployment be verified from the command line:
    a reachable API with an empty database returns `database_ok: true` with zero
    counts, which is a different (and diagnosable) state from an unreachable API.
    """
    settings = get_settings()
    payload: dict = {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
        "database": "sqlite" if settings.database_url.startswith("sqlite") else "postgresql",
        "database_ok": False,
    }
    try:
        with SessionLocal() as db:
            payload["listings"] = db.scalar(select(func.count()).select_from(SupplierListing)) or 0
            payload["product_groups"] = db.scalar(select(func.count()).select_from(ProductGroup)) or 0
            payload["pending_reviews"] = (
                db.scalar(
                    select(func.count()).select_from(MatchCandidate).where(MatchCandidate.status == "pending")
                )
                or 0
            )
        payload["database_ok"] = True
    except Exception as exc:  # noqa: BLE001 - health must never raise
        payload["status"] = "degraded"
        payload["database_error"] = str(exc)[:200]
    return payload
