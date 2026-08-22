from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from pagume_api.offline.router import connect_args_for, get_router
from pagume_api.portal.core.config import to_asyncpg

_engines: dict[str, object] = {}
_factories: dict[str, async_sessionmaker] = {}

# Kept for callers that grab the factory directly; always points at the active
# target after get_async_engine() has run.
AsyncSessionLocal = None


def get_async_engine():
    global AsyncSessionLocal
    router = get_router()
    target = router.active

    engine = _engines.get(target)
    if engine is None:
        url = to_asyncpg(router.url_for(target))
        engine = create_async_engine(
            url,
            pool_pre_ping=True,
            echo=False,
            connect_args=connect_args_for(url, router.connect_timeout),
        )
        _engines[target] = engine
        _factories[target] = async_sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
            class_=AsyncSession,
        )

    AsyncSessionLocal = _factories[target]
    return engine


def reset_async_engine() -> None:
    global AsyncSessionLocal
    for engine in _engines.values():
        try:
            engine.sync_engine.dispose()
        except Exception:
            pass
    _engines.clear()
    _factories.clear()
    AsyncSessionLocal = None


# Lazy init — do not create engine at import time.
