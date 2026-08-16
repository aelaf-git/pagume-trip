from fastapi import APIRouter
from src.api.routers.auth import router as auth_router
from src.api.routers.providers import router as providers_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(providers_router, prefix="/providers", tags=["providers"])
