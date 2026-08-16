from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.deps import get_db, get_current_active_user
from src.db.models.user import User, UserRole
from src.db.models.provider import Hotel
from src.schemas.inventory import HotelCreate, HotelResponse

router = APIRouter()

def require_hotel_provider(current_user: User = Depends(get_current_active_user)):
    if current_user.role not in [UserRole.HOTEL_PROVIDER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.post("/hotels", response_model=HotelResponse)
async def create_hotel(
    hotel_in: HotelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hotel_provider)
):
    hotel = Hotel(
        **hotel_in.model_dump(),
        provider_id=current_user.id
    )
    db.add(hotel)
    await db.commit()
    await db.refresh(hotel)
    return hotel

@router.get("/hotels", response_model=List[HotelResponse])
async def read_my_hotels(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hotel_provider)
):
    stmt = select(Hotel).where(Hotel.provider_id == current_user.id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    hotels = result.scalars().all()
    return hotels
