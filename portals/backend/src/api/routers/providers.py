from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.deps import get_db, get_current_active_user
from src.db.models.user import User, UserRole
from src.db.models.provider import Hotel, Room, TourPackage, Vehicle
from src.schemas.inventory import (
    HotelCreate, HotelResponse,
    RoomCreate, RoomResponse,
    TourPackageCreate, TourPackageResponse,
    VehicleCreate, VehicleResponse
)

router = APIRouter()

def require_role(roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role not in roles and current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
    return role_checker

# HOTELS
@router.post("/hotels", response_model=HotelResponse)
async def create_hotel(
    hotel_in: HotelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER]))
):
    hotel = Hotel(**hotel_in.model_dump(), provider_id=current_user.id)
    db.add(hotel)
    await db.commit()
    await db.refresh(hotel)
    return hotel

@router.get("/hotels", response_model=List[HotelResponse])
async def read_my_hotels(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER]))
):
    stmt = select(Hotel).where(Hotel.provider_id == current_user.id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

# ROOMS
@router.post("/hotels/{hotel_id}/rooms", response_model=RoomResponse)
async def create_room(
    hotel_id: int,
    room_in: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER]))
):
    # Verify hotel belongs to user
    stmt = select(Hotel).where(Hotel.id == hotel_id, Hotel.provider_id == current_user.id)
    result = await db.execute(stmt)
    hotel = result.scalars().first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found or not owned by user")
    
    room = Room(**room_in.model_dump(), hotel_id=hotel_id)
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room

@router.get("/hotels/{hotel_id}/rooms", response_model=List[RoomResponse])
async def read_hotel_rooms(
    hotel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER]))
):
    stmt = select(Room).where(Room.hotel_id == hotel_id)
    result = await db.execute(stmt)
    return result.scalars().all()

# TOUR PACKAGES
@router.post("/tours", response_model=TourPackageResponse)
async def create_tour_package(
    tour_in: TourPackageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.TOUR_AGENCY]))
):
    tour = TourPackage(**tour_in.model_dump(), agency_id=current_user.id)
    db.add(tour)
    await db.commit()
    await db.refresh(tour)
    return tour

@router.get("/tours", response_model=List[TourPackageResponse])
async def read_my_tours(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.TOUR_AGENCY]))
):
    stmt = select(TourPackage).where(TourPackage.agency_id == current_user.id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

# VEHICLES
@router.post("/vehicles", response_model=VehicleResponse)
async def create_vehicle(
    vehicle_in: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CAR_RENTAL]))
):
    vehicle = Vehicle(**vehicle_in.model_dump(), rental_company_id=current_user.id)
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle

@router.get("/vehicles", response_model=List[VehicleResponse])
async def read_my_vehicles(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CAR_RENTAL]))
):
    stmt = select(Vehicle).where(Vehicle.rental_company_id == current_user.id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/hotels/{hotel_id}", response_model=HotelResponse)
async def update_hotel(
    hotel_id: int,
    hotel_in: HotelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER]))
):
    stmt = select(Hotel).where(Hotel.id == hotel_id, Hotel.provider_id == current_user.id)
    result = await db.execute(stmt)
    hotel = result.scalars().first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found or not owned by user")
    
    update_data = hotel_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(hotel, key, value)
    
    await db.commit()
    await db.refresh(hotel)
    return hotel

@router.delete("/hotels/{hotel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hotel(
    hotel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER]))
):
    stmt = select(Hotel).where(Hotel.id == hotel_id, Hotel.provider_id == current_user.id)
    result = await db.execute(stmt)
    hotel = result.scalars().first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found or not owned by user")
    
    await db.delete(hotel)
    await db.commit()
    return None

@router.put("/hotels/{hotel_id}/rooms/{room_id}", response_model=RoomResponse)
async def update_room(
    hotel_id: int,
    room_id: int,
    room_in: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER]))
):
    stmt = select(Room).join(Hotel).where(Room.id == room_id, Room.hotel_id == hotel_id, Hotel.provider_id == current_user.id)
    result = await db.execute(stmt)
    room = result.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or not owned by user")
    
    update_data = room_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(room, key, value)
    
    await db.commit()
    await db.refresh(room)
    return room

@router.delete("/hotels/{hotel_id}/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    hotel_id: int,
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER]))
):
    stmt = select(Room).join(Hotel).where(Room.id == room_id, Room.hotel_id == hotel_id, Hotel.provider_id == current_user.id)
    result = await db.execute(stmt)
    room = result.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or not owned by user")
    
    await db.delete(room)
    await db.commit()
    return None

@router.put("/tours/{tour_id}", response_model=TourPackageResponse)
async def update_tour_package(
    tour_id: int,
    tour_in: TourPackageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.TOUR_AGENCY]))
):
    stmt = select(TourPackage).where(TourPackage.id == tour_id, TourPackage.agency_id == current_user.id)
    result = await db.execute(stmt)
    tour = result.scalars().first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour package not found or not owned by user")
    
    update_data = tour_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tour, key, value)
    
    await db.commit()
    await db.refresh(tour)
    return tour

@router.delete("/tours/{tour_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tour_package(
    tour_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.TOUR_AGENCY]))
):
    stmt = select(TourPackage).where(TourPackage.id == tour_id, TourPackage.agency_id == current_user.id)
    result = await db.execute(stmt)
    tour = result.scalars().first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour package not found or not owned by user")
    
    await db.delete(tour)
    await db.commit()
    return None

@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CAR_RENTAL]))
):
    stmt = select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.rental_company_id == current_user.id)
    result = await db.execute(stmt)
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found or not owned by user")
    
    update_data = vehicle_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vehicle, key, value)
    
    await db.commit()
    await db.refresh(vehicle)
    return vehicle

@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CAR_RENTAL]))
):
    stmt = select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.rental_company_id == current_user.id)
    result = await db.execute(stmt)
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found or not owned by user")
    
    await db.delete(vehicle)
    await db.commit()
    return None
