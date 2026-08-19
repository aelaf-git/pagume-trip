from fastapi import APIRouter
from src.api.routers.auth import router as auth_router
from src.api.routers.providers import router as providers_router
from src.api.routers.admin import router as admin_router
from src.api.routers.public import router as public_router
from src.api.routers.media import router as media_router
from src.api.routers.bookings import router as bookings_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(providers_router, prefix="/providers", tags=["providers"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(public_router, prefix="/public", tags=["public"])
api_router.include_router(media_router, prefix="/media", tags=["media"])
api_router.include_router(bookings_router, prefix="/bookings", tags=["bookings"])
