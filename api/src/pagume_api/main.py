import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from pagume_api.config import get_settings
from pagume_api.db import Base, get_engine, get_session_factory
from pagume_api.offline.router import PRIMARY, get_router
from pagume_api.offline.sync import pending_count, push_pending
from pagume_api.portal.db.base_class import Base as PortalBase
from pagume_api.portal.db.session import reset_async_engine
import pagume_api.models  # noqa: F401
import pagume_api.portal.db.models  # noqa: F401
from pagume_api.routers import bookings, destinations, hotels, tours, trips, vehicles
from pagume_api.portal.api.routers import api_router as portal_router
from pagume_api.seed import seed_if_empty

logger = logging.getLogger(__name__)


def _prepare_schema_and_seed() -> None:
    Base.metadata.create_all(bind=get_engine())
    PortalBase.metadata.create_all(bind=get_engine())
    if get_settings().seed_on_startup:
        db = get_session_factory()()
        try:
            seed_if_empty(db)
            db.commit()
        finally:
            db.close()


async def _probe_loop() -> None:
    """Watch the primary, switch targets, and replay offline writes on recovery."""
    settings = get_settings()
    router = get_router()
    while True:
        await asyncio.sleep(settings.db_probe_interval)
        try:
            before, after = await asyncio.to_thread(router.refresh)
        except Exception as exc:  # noqa: BLE001 — the loop must survive anything
            logger.warning("Database probe failed: %s", exc)
            continue

        if before == after:
            continue

        # The async portal engine caches per target; drop it so the switch lands.
        reset_async_engine()
        logger.info("Database target switched from %s to %s", before, after)

        if after == PRIMARY and settings.db_sync_auto_push:
            result = await asyncio.to_thread(push_pending)
            if result.pushed or result.failed:
                logger.info(
                    "Write-back: pushed=%s failed=%s remaining=%s",
                    result.pushed,
                    result.failed,
                    result.remaining,
                )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    router = get_router()
    settings = get_settings()
    if router.failover_enabled:
        # Cap the first probe so a hung DNS/SSL path cannot block readiness.
        probe_budget = max(settings.db_connect_timeout * 3, 10)
        try:
            await asyncio.wait_for(
                asyncio.to_thread(router.refresh),
                timeout=probe_budget,
            )
        except TimeoutError:
            router.report_failure(PRIMARY)
            logger.warning(
                "Primary probe timed out after %ss — serving from the local mirror",
                probe_budget,
            )

    try:
        await asyncio.to_thread(_prepare_schema_and_seed)
    except OperationalError as exc:
        if not router.report_failure(router.active):
            raise
        logger.warning("Startup on the primary failed (%s) — retrying on the mirror", exc)
        await asyncio.to_thread(_prepare_schema_and_seed)

    probe: asyncio.Task | None = None
    if router.failover_enabled:
        probe = asyncio.create_task(_probe_loop())
    try:
        yield
    finally:
        if probe is not None:
            probe.cancel()
            with suppress(asyncio.CancelledError):
                await probe


def create_app() -> FastAPI:
    app = FastAPI(
        title="Pagume API",
        version="0.1.0",
        description="Verified tourism inventory, trips, and bookings for Pagume agents.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(OperationalError)
    async def _database_unavailable(_request: Request, exc: OperationalError) -> JSONResponse:
        router = get_router()
        switched = router.report_failure(router.active)
        if switched:
            reset_async_engine()
        detail = (
            "Database connection lost. Switched to the local mirror — retry the request."
            if switched
            else "Database temporarily unavailable. Please retry."
        )
        logger.warning("Database error on %s: %s", router.active, exc)
        return JSONResponse(status_code=503, content={"detail": detail})

    app.include_router(destinations.router)
    app.include_router(hotels.router)
    app.include_router(vehicles.transport_router)
    app.include_router(vehicles.rentals_router)
    app.include_router(vehicles.vehicles_router)
    app.include_router(tours.router)
    app.include_router(trips.router)
    app.include_router(bookings.router)
    app.include_router(portal_router, prefix="/api/v1")

    @app.get("/health")
    def health() -> dict:
        router = get_router()
        return {
            "status": "ok",
            "active_target": router.active,
            "failover_enabled": router.failover_enabled,
            "journal_pending": pending_count(),
        }

    return app


app = create_app()


def main() -> None:
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "pagume_api.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )
