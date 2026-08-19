import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from src.api.deps import get_db
from src.db.base_class import Base

# Use an in-memory SQLite database for testing
# We use aiosqlite for async SQLite support
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

from sqlalchemy import event

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

@event.listens_for(engine.sync_engine, "connect")
def load_spatialite(dbapi_conn, connection_record):
    dbapi_conn.enable_load_extension(True)
    # Attempt to load mod_spatialite for GeoAlchemy2 to work in SQLite
    try:
        dbapi_conn.load_extension('mod_spatialite')
    except Exception:
        pass
    dbapi_conn.enable_load_extension(False)
    
    # Initialize spatial metadata for SQLite
    cursor = dbapi_conn.cursor()
    try:
        cursor.execute("SELECT InitSpatialMetaData(1);")
    except Exception:
        pass
    finally:
        cursor.close()

TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(autouse=True)
async def prepare_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
