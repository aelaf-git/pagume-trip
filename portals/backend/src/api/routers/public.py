from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.deps import get_db
from src.db.models.destination import Destination
from src.db.models.provider import Hotel, Room, TourPackage, Vehicle
from src.schemas.destination import DestinationResponse
from src.schemas.inventory import HotelResponse, RoomResponse, TourPackageResponse, VehicleResponse

router = APIRouter()

@router.get("/destinations", response_model=List[DestinationResponse])
async def search_destinations(
    query: Optional[str] = None,
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Destination).where(Destination.status == "ACTIVE")
    if query:
        stmt = stmt.where(Destination.name.ilike(f"%{query}%"))
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/hotels", response_model=List[HotelResponse])
async def search_hotels(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Hotel).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/tours", response_model=List[TourPackageResponse])
async def search_tours(
    destination: Optional[str] = None,
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TourPackage)
    if destination:
        stmt = stmt.where(TourPackage.destination.ilike(f"%{destination}%"))
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/vehicles", response_model=List[VehicleResponse])
async def search_vehicles(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Vehicle)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
