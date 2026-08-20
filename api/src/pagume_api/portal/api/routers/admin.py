from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pagume_api.models import Destination as MainDestination
from pagume_api.portal.api.deps import get_current_active_user, get_db
from pagume_api.portal.db.models.destination import Destination
from pagume_api.portal.db.models.provider import DriverProfile
from pagume_api.portal.db.models.user import User, UserRole
from pagume_api.portal.schemas.destination import DestinationCreate, DestinationResponse
from pagume_api.portal.schemas.inventory import DriverProfileResponse
from pagume_api.portal.schemas.user import UserResponse

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


@router.put("/users/{user_id}/verify", response_model=UserResponse)
async def verify_provider(
    user_id: int,
    is_verified: bool = True,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = is_verified
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/drivers/{user_id}/verify", response_model=DriverProfileResponse)
async def verify_driver(
    user_id: int,
    verification_status: str = "VERIFIED",
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    if verification_status not in {"UNDER_REVIEW", "VERIFIED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Invalid verification_status")
    result = await db.execute(
        select(DriverProfile).where(DriverProfile.user_id == user_id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    profile.verification_status = verification_status
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    if user and verification_status == "VERIFIED":
        user.is_verified = True
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/drivers", response_model=List[DriverProfileResponse])
async def list_drivers(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(DriverProfile))
    return result.scalars().all()


@router.post("/destinations", response_model=DestinationResponse)
async def create_destination(
    destination_in: DestinationCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    destination = Destination(**destination_in.model_dump())
    db.add(destination)
    await db.commit()
    await db.refresh(destination)

    main_id = destination.name.lower().replace(" ", "_")
    if not main_id.startswith("dest_"):
        main_id = f"dest_{main_id}"
    existing = (
        await db.execute(select(MainDestination).where(MainDestination.id == main_id))
    ).scalars().first()
    if not existing:
        db.add(
            MainDestination(
                id=main_id,
                name=destination.name,
                description=destination.description or "",
                region=destination.region or "",
                zone=destination.zone or "",
                latitude=destination.latitude or 0.0,
                longitude=destination.longitude or 0.0,
                category=destination.category or "destination",
                verification_status=destination.verification_status or "VERIFIED",
            )
        )
        await db.commit()
    return destination


@router.get("/destinations", response_model=List[DestinationResponse])
async def read_destinations(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(Destination).offset(skip).limit(limit))
    return result.scalars().all()
