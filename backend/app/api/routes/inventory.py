from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.inventory_service import content_consolidation, group_detail, list_groups

router = APIRouter(tags=["inventory"], prefix="/inventory")


@router.get("/hotels")
def hotels(
    search: str | None = None,
    city: str | None = None,
    supplier: str | None = None,
    status: str | None = None,
    sort: str = Query("confidence", pattern="^(confidence|name|city|listings|price)$"),
    db: Session = Depends(get_db),
) -> dict:
    return list_groups(db, "hotel", search=search, city=city, supplier_code=supplier, status=status, sort=sort)


@router.get("/hotels/{code}")
def hotel_detail(code: str, db: Session = Depends(get_db)) -> dict:
    payload = group_detail(db, code)
    if payload is None:
        raise HTTPException(status_code=404, detail=f"Hotel product group '{code}' not found")
    return payload


@router.get("/sightseeing")
def sightseeing(
    search: str | None = None,
    city: str | None = None,
    supplier: str | None = None,
    status: str | None = None,
    sort: str = Query("confidence", pattern="^(confidence|name|city|listings|price)$"),
    db: Session = Depends(get_db),
) -> dict:
    return list_groups(db, "sightseeing", search=search, city=city, supplier_code=supplier, status=status, sort=sort)


@router.get("/sightseeing/{code}")
def sightseeing_detail(code: str, db: Session = Depends(get_db)) -> dict:
    payload = group_detail(db, code)
    if payload is None:
        raise HTTPException(status_code=404, detail=f"Sightseeing product group '{code}' not found")
    return payload


@router.get("/content")
def content(db: Session = Depends(get_db)) -> dict:
    return {
        "hotels": content_consolidation(db, "hotel"),
        "sightseeing": content_consolidation(db, "sightseeing"),
        "notice": (
            "Supplier-style names and descriptions are synthetic demonstration data. "
            "Illustrative image placeholders are used — no supplier photography is reproduced."
        ),
    }
