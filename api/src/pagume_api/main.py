from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pagume_api.config import get_settings
from pagume_api.db import Base, get_engine, get_session_factory
from pagume_api.models import *  # noqa: F401,F403 — register tables
from pagume_api.routers import bookings, destinations, hotels, tours, trips, vehicles
from pagume_api.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=get_engine())
    settings = get_settings()
    if settings.seed_on_startup:
        db = get_session_factory()()
        try:
            seed_if_empty(db)
            db.commit()
        finally:
            db.close()
    yield


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
    app.include_router(destinations.router)
    app.include_router(hotels.router)
    app.include_router(vehicles.transport_router)
    app.include_router(vehicles.rentals_router)
    app.include_router(vehicles.vehicles_router)
    app.include_router(tours.router)
    app.include_router(trips.router)
    app.include_router(bookings.router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

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
