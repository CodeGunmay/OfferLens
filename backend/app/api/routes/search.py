"""Global search used by the top navigation."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import ProductGroup, SupplierListing

router = APIRouter(tags=["search"], prefix="/search")


@router.get("")
def search(q: str = Query("", max_length=80), db: Session = Depends(get_db)) -> dict:
    needle = q.strip().lower()
    if len(needle) < 2:
        return {"query": q, "results": []}

    groups = list(db.scalars(select(ProductGroup)).all())
    listings = list(db.scalars(select(SupplierListing)).all())

    results = []
    for group in groups:
        if needle in group.canonical_name.lower() or needle in group.city.lower():
            results.append(
                {
                    "type": "product",
                    "id": group.code,
                    "title": group.canonical_name,
                    "subtitle": f"{group.category.title()} · {group.city} · {group.status}",
                    "href": f"/{'hotels' if group.category == 'hotel' else 'sightseeing'}/{group.code}",
                }
            )
    for listing in listings:
        if needle in listing.name.lower() or needle in listing.supplier_property_id.lower():
            results.append(
                {
                    "type": "listing",
                    "id": str(listing.id),
                    "title": listing.name,
                    "subtitle": f"Supplier listing · {listing.city} · confidence {listing.match_confidence:.2f}",
                    "href": f"/matches?search={listing.name[:24].replace(' ', '%20')}",
                }
            )
    return {"query": q, "results": results[:12]}
