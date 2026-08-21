"""Authenticated image upload endpoints (Cloudinary)."""

from fastapi import APIRouter, Depends, File, Query, UploadFile
from pydantic import BaseModel

from pagume_api.portal.api.deps import require_role
from pagume_api.portal.db.models.user import User, UserRole
from pagume_api.portal.services.cloudinary_upload import upload_hotel_image

router = APIRouter()


class ImageUploadResponse(BaseModel):
    url: str
    public_id: str | None = None
    kind: str
    width: int | None = None
    height: int | None = None
    format: str | None = None
    size: int | None = None


@router.post("/images", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    kind: str = Query(
        "gallery",
        description="cover | profile | gallery",
    ),
    current_user: User = Depends(
        require_role([UserRole.HOTEL_PROVIDER, UserRole.ADMIN])
    ),
):
    """Upload a hotel image to Cloudinary. Returns a public HTTPS URL."""
    _ = current_user
    return await upload_hotel_image(file, kind=kind)
