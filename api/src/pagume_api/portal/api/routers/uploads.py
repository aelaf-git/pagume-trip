"""Authenticated image upload endpoints (Cloudinary)."""

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel

from pagume_api.portal.api.deps import require_role
from pagume_api.portal.db.models.user import User, UserRole
from pagume_api.portal.services.cloudinary_upload import upload_image

router = APIRouter()


class ImageUploadResponse(BaseModel):
    url: str
    public_id: str | None = None
    kind: str
    scope: str | None = None
    width: int | None = None
    height: int | None = None
    format: str | None = None
    size: int | None = None


@router.post("/images", response_model=ImageUploadResponse)
async def upload_media(
    file: UploadFile = File(...),
    kind: str = Query(
        "gallery",
        description="cover | profile | gallery | logo",
    ),
    scope: str = Query(
        "hotels",
        description="hotels | tours | agency | vehicles | car_rental | destinations",
    ),
    current_user: User = Depends(
        require_role(
            [
                UserRole.HOTEL_PROVIDER,
                UserRole.TOUR_AGENCY,
                UserRole.CAR_RENTAL,
                UserRole.ADMIN,
            ]
        )
    ),
):
    """Upload an image to Cloudinary. Returns a public HTTPS URL."""
    if current_user.role == UserRole.HOTEL_PROVIDER and scope not in {"hotels"}:
        raise HTTPException(status_code=403, detail="Hotel providers may only upload hotel images.")
    if current_user.role == UserRole.TOUR_AGENCY and scope not in {"tours", "agency"}:
        raise HTTPException(
            status_code=403,
            detail="Tour agencies may only upload tour or agency profile images.",
        )
    if current_user.role == UserRole.CAR_RENTAL and scope not in {"vehicles", "car_rental"}:
        raise HTTPException(
            status_code=403,
            detail="Car rentals may only upload vehicle or company profile images.",
        )
    return await upload_image(file, kind=kind, scope=scope)
