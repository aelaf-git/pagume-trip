from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from pagume_api.portal.core.config import get_portal_settings

_engine = None
AsyncSessionLocal = None


def get_async_engine():
    global _engine, AsyncSessionLocal
    if _engine is None:
        settings = get_portal_settings()
        connect_args = {}
        url = settings.SQLALCHEMY_DATABASE_URI
        if url.startswith("sqlite"):
            connect_args = {"check_same_thread": False}
        _engine = create_async_engine(url, pool_pre_ping=True, echo=False, connect_args=connect_args)
        AsyncSessionLocal = async_sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=_engine,
            class_=AsyncSession,
        )
    return _engine


def reset_async_engine() -> None:
    global _engine, AsyncSessionLocal
    if _engine is not None:
        try:
            _engine.sync_engine.dispose()
        except Exception:
            pass
    _engine = None
    AsyncSessionLocal = None


# Lazy init — do not create engine at import time.
