"""Test configuration.

Points DATABASE_URL at a throwaway SQLite file *before* the app modules import,
so tests never touch the development database.
"""
import os
import tempfile

_TMP_DIR = tempfile.mkdtemp(prefix="offerlens-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DIR}/test.db"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database.seed import seed_database  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _seed():
    seed_database(force=True)


@pytest.fixture()
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
