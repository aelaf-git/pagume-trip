from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from pagume_api.config import get_settings
from pagume_api.offline.router import connect_args_for, get_router, reset_router


class Base(DeclarativeBase):
    pass


_engines: dict[str, Engine] = {}
_factories: dict[str, sessionmaker] = {}


def _engine_kwargs(url: str) -> dict:
    settings = get_settings()
    kwargs: dict = {
        "future": True,
        "connect_args": connect_args_for(url, settings.db_connect_timeout),
    }
    if not url.startswith("sqlite"):
        # Neon / cloud Postgres: recycle dead SSL sockets instead of serving 500s.
        kwargs["pool_pre_ping"] = True
        kwargs["pool_recycle"] = 300
    return kwargs


def get_engine_for(target: str) -> Engine:
    engine = _engines.get(target)
    if engine is not None:
        return engine

    url = get_router().url_for(target)
    if not url:
        raise RuntimeError(f"No database URL configured for target '{target}'")

    engine = create_engine(url, **_engine_kwargs(url))
    if url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def _sqlite_fk(dbapi_connection, _connection_record) -> None:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    _engines[target] = engine
    _factories[target] = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, class_=Session
    )
    return engine


def get_engine() -> Engine:
    return get_engine_for(get_router().active)


def get_session_factory() -> sessionmaker:
    target = get_router().active
    get_engine_for(target)
    return _factories[target]


def reset_engine() -> None:
    for engine in _engines.values():
        engine.dispose()
    _engines.clear()
    _factories.clear()
    reset_router()


def get_db() -> Generator[Session, None, None]:
    router = get_router()
    target = router.active
    db = get_session_factory()()
    try:
        yield db
        db.commit()
    except OperationalError:
        db.rollback()
        # Next request goes to the mirror; this one still surfaces the error.
        router.report_failure(target)
        raise
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
