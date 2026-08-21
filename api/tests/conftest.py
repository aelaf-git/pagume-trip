import pytest
from fastapi.testclient import TestClient

from pagume_api.config import get_settings
from pagume_api.db import reset_engine
from pagume_api.main import create_app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/pagume.db")
    monkeypatch.setenv("SEED_ON_STARTUP", "true")
    get_settings.cache_clear()
    reset_engine()
    app = create_app()
    with TestClient(app) as http:
        yield http
    reset_engine()
    get_settings.cache_clear()
