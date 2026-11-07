"""Application configuration.

All values are environment-overridable (see .env.example). No secrets are
hardcoded here; the demo defaults are safe, local-only values.
"""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = BACKEND_DIR.parent

# Browser origins that may call this API. Anything served by Netlify, Render,
# Railway, Fly or the in-sandbox preview is accepted out of the box; specific
# hosts can be added with the CORS_ORIGINS environment variable.
DEFAULT_ORIGIN_REGEX = (
    r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?"
    r"|https?://[a-z0-9-]+\.netlify\.app"
    r"|https?://[a-z0-9-]+\.e2b\.app"
    r"|https?://[a-z0-9-]+\.onrender\.com"
    r"|https?://[a-z0-9-]+\.up\.railway\.app"
    r"|https?://[a-z0-9-]+\.railway\.app"
    r"|https?://[a-z0-9-]+\.fly\.dev"
    r"|https?://[a-z0-9-]+\.vercel\.app"
    r"|https?://[a-z0-9-]+\.herokuapp\.com"
    r"|https?://[a-z0-9-]+\.pythonanywhere\.com"
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    app_name: str = "OfferLens API"
    api_prefix: str = "/api"
    environment: str = "DEMO WORKSPACE"

    # PostgreSQL-compatible schema; SQLite is used for the local demo so the
    # prototype runs with zero infrastructure. Point DATABASE_URL at Postgres
    # (e.g. postgresql+psycopg://user:pass@localhost:5432/offerlens) to switch.
    # Hosting platforms usually inject DATABASE_URL themselves.
    database_url: str = f"sqlite:///{BACKEND_DIR / 'offerlens.db'}"

    # Seed the database automatically when it is empty (idempotent).
    seed_on_startup: bool = True

    # Where the built frontend lives (single-process production-style serving).
    frontend_dist: Path = REPO_DIR / "frontend" / "dist"

    # Explicit allow-list. Accepts a comma-separated string in the environment,
    # e.g. CORS_ORIGINS="https://app.example.com,https://staging.example.com".
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Regex allow-list for hosted frontends (Netlify previews change per deploy).
    cors_origin_regex: str = DEFAULT_ORIGIN_REGEX

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            text = value.strip()
            if not text:
                return []
            if text.startswith("["):  # allow a JSON list too
                return value
            return [part.strip() for part in text.split(",") if part.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
