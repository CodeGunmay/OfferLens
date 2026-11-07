"""Aggregated API router."""
from fastapi import APIRouter

from app.api.routes import analytics, health, inventory, matches, offers, overview, ranking, search, settings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(overview.router)
api_router.include_router(inventory.router)
api_router.include_router(offers.router)
api_router.include_router(matches.router)
api_router.include_router(ranking.router)
api_router.include_router(analytics.router)
api_router.include_router(settings.router)
api_router.include_router(search.router)
