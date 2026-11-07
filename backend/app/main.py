"""OfferLens API entrypoint.

Run locally:  uvicorn app.main:app --reload --port 8000
Serves the API under /api and, when `frontend/dist` exists, the built SPA too.
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.config import get_settings
from app.database.seed import seed_database

settings = get_settings()
logger = logging.getLogger("offerlens")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and load the synthetic dataset if the database is empty.
    # Idempotent: on a platform with an ephemeral disk this runs on every boot.
    try:
        seeded = seed_database()
        logger.info("database ready (seeded=%s)", bool(seeded))
    except Exception:  # pragma: no cover - startup diagnostics only
        # Keep the process alive so /api/health can report the problem instead
        # of the platform showing a crash loop with no explanation.
        logger.exception("database initialisation failed")
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "OfferLens — multi-supplier offer matching and optimization concept prototype. "
        "Synthetic demonstration data only; not a TBO product."
    ),
    lifespan=lifespan,
)

# CORS: an explicit allow-list plus a regex that covers Netlify (including
# per-deploy preview domains), Render, Railway, Fly and the sandbox preview.
allow_all = "*" in settings.cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else settings.cors_origins,
    allow_origin_regex=None if allow_all else settings.cors_origin_regex,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/api", include_in_schema=False)
def api_root() -> dict:
    return {"service": settings.app_name, "docs": "/docs", "health": "/api/health"}


# Hosting platforms probe a plain path; keep one outside the API prefix too.
@app.get("/healthz", include_in_schema=False)
def healthz() -> dict:
    return {"status": "ok", "service": settings.app_name}


# ---- Optional static serving of the built frontend (single-process demo) ----
dist_dir: Path = settings.frontend_dist
if dist_dir.exists() and (dist_dir / "index.html").exists():
    assets_dir = dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        candidate = dist_dir / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(dist_dir / "index.html")
