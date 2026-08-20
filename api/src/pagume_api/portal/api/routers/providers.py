from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from pagume_api.portal.api.deps import get_current_active_user, get_db, require_role
from pagume_api.portal.db.models.provider import (
    DriverProfile,
    Hotel,
    Room,
    TourPackage,
    Vehicle,
)
from pagume_api.portal.db.models.user import User, UserRole
from pagume_api.portal.schemas.inventory import (
    AvailabilityUpdate,
    DriverProfileResponse,
    DriverProfileUpdate,
    HotelCreate,
    HotelResponse,
    HotelUpdate,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
    TourPackageCreate,
    TourPackageResponse,
    TourPackageUpdate,
    VehicleCreate,
    VehicleResponse,
    VehicleUpdate,
)

router = APIRouter()


def _apply_update(obj, data: dict) -> None:
    for key, value in data.items():
        if value is not None:
            setattr(obj, key, value)


# ── Hotels ──────────────────────────────────────────────────────────────────


@router.post("/hotels", response_model=HotelResponse)
async def create_hotel(
    hotel_in: HotelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    hotel = Hotel(**hotel_in.model_dump(), provider_id=current_user.id)
    db.add(hotel)
    await db.flush()
    hotel_id = hotel.id
    await db.commit()
    result = await db.execute(
        select(Hotel).options(selectinload(Hotel.rooms)).where(Hotel.id == hotel_id)
    )
    return result.scalars().first()


@router.get("/hotels", response_model=List[HotelResponse])
async def read_my_hotels(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    stmt = (
        select(Hotel)
        .options(selectinload(Hotel.rooms))
        .where(Hotel.provider_id == current_user.id)
    )
    if current_user.role == UserRole.ADMIN:
        stmt = select(Hotel).options(selectinload(Hotel.rooms))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/hotels/{hotel_id}", response_model=HotelResponse)
async def read_hotel(
    hotel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    hotel = await _get_owned_hotel(db, hotel_id, current_user)
    return hotel


@router.put("/hotels/{hotel_id}", response_model=HotelResponse)
async def update_hotel(
    hotel_id: int,
    hotel_in: HotelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    hotel = await _get_owned_hotel(db, hotel_id, current_user)
    _apply_update(hotel, hotel_in.model_dump(exclude_unset=True))
    await db.commit()
    result = await db.execute(
        select(Hotel).options(selectinload(Hotel.rooms)).where(Hotel.id == hotel_id)
    )
    return result.scalars().first()


@router.delete("/hotels/{hotel_id}", status_code=204)
async def delete_hotel(
    hotel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    hotel = await _get_owned_hotel(db, hotel_id, current_user)
    await db.delete(hotel)
    await db.commit()


async def _get_owned_hotel(db: AsyncSession, hotel_id: int, user: User) -> Hotel:
    result = await db.execute(
        select(Hotel).options(selectinload(Hotel.rooms)).where(Hotel.id == hotel_id)
    )
    hotel = result.scalars().first()
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if user.role != UserRole.ADMIN and hotel.provider_id != user.id:
        raise HTTPException(status_code=403, detail="Not your hotel")
    return hotel


# ── Rooms ───────────────────────────────────────────────────────────────────


@router.post("/hotels/{hotel_id}/rooms", response_model=RoomResponse)
async def create_room(
    hotel_id: int,
    room_in: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    await _get_owned_hotel(db, hotel_id, current_user)
    room = Room(**room_in.model_dump(), hotel_id=hotel_id)
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room


@router.get("/hotels/{hotel_id}/rooms", response_model=List[RoomResponse])
async def read_hotel_rooms(
    hotel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    await _get_owned_hotel(db, hotel_id, current_user)
    result = await db.execute(select(Room).where(Room.hotel_id == hotel_id))
    return result.scalars().all()


@router.put("/rooms/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: int,
    room_in: RoomUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalars().first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    await _get_owned_hotel(db, room.hotel_id, current_user)
    _apply_update(room, room_in.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(room)
    return room


@router.put("/rooms/{room_id}/availability", response_model=RoomResponse)
async def update_room_availability(
    room_id: int,
    body: AvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalars().first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    await _get_owned_hotel(db, room.hotel_id, current_user)
    room.availability_dates = body.availability_dates
    await db.commit()
    await db.refresh(room)
    return room


@router.delete("/rooms/{room_id}", status_code=204)
async def delete_room(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.HOTEL_PROVIDER])),
):
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalars().first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    await _get_owned_hotel(db, room.hotel_id, current_user)
    await db.delete(room)
    await db.commit()


# ── Tours ────────────────────────────────────────────────────────────────────


@router.post("/tours", response_model=TourPackageResponse)
async def create_tour(
    tour_in: TourPackageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.TOUR_AGENCY])),
):
    tour = TourPackage(**tour_in.model_dump(), agency_id=current_user.id)
    db.add(tour)
    await db.commit()
    await db.refresh(tour)
    return tour


@router.get("/tours", response_model=List[TourPackageResponse])
async def read_my_tours(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.TOUR_AGENCY])),
):
    stmt = select(TourPackage).where(TourPackage.agency_id == current_user.id)
    if current_user.role == UserRole.ADMIN:
        stmt = select(TourPackage)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.put("/tours/{tour_id}", response_model=TourPackageResponse)
async def update_tour(
    tour_id: int,
    tour_in: TourPackageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.TOUR_AGENCY])),
):
    tour = await _get_owned_tour(db, tour_id, current_user)
    _apply_update(tour, tour_in.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(tour)
    return tour


@router.put("/tours/{tour_id}/availability", response_model=TourPackageResponse)
async def update_tour_availability(
    tour_id: int,
    body: AvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.TOUR_AGENCY])),
):
    tour = await _get_owned_tour(db, tour_id, current_user)
    tour.availability_dates = body.availability_dates
    await db.commit()
    await db.refresh(tour)
    return tour


@router.delete("/tours/{tour_id}", status_code=204)
async def delete_tour(
    tour_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.TOUR_AGENCY])),
):
    tour = await _get_owned_tour(db, tour_id, current_user)
    await db.delete(tour)
    await db.commit()


async def _get_owned_tour(db: AsyncSession, tour_id: int, user: User) -> TourPackage:
    result = await db.execute(select(TourPackage).where(TourPackage.id == tour_id))
    tour = result.scalars().first()
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    if user.role != UserRole.ADMIN and tour.agency_id != user.id:
        raise HTTPException(status_code=403, detail="Not your tour")
    return tour


# ── Vehicles ─────────────────────────────────────────────────────────────────


@router.post("/vehicles", response_model=VehicleResponse)
async def create_vehicle(
    vehicle_in: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CAR_RENTAL])),
):
    vehicle = Vehicle(**vehicle_in.model_dump(), rental_company_id=current_user.id)
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.get("/vehicles", response_model=List[VehicleResponse])
async def read_my_vehicles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CAR_RENTAL])),
):
    stmt = select(Vehicle).where(Vehicle.rental_company_id == current_user.id)
    if current_user.role == UserRole.ADMIN:
        stmt = select(Vehicle)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CAR_RENTAL])),
):
    vehicle = await _get_owned_vehicle(db, vehicle_id, current_user)
    _apply_update(vehicle, vehicle_in.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.put("/vehicles/{vehicle_id}/availability", response_model=VehicleResponse)
async def update_vehicle_availability(
    vehicle_id: int,
    body: AvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CAR_RENTAL])),
):
    vehicle = await _get_owned_vehicle(db, vehicle_id, current_user)
    vehicle.availability_dates = body.availability_dates
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.delete("/vehicles/{vehicle_id}", status_code=204)
async def delete_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CAR_RENTAL])),
):
    vehicle = await _get_owned_vehicle(db, vehicle_id, current_user)
    await db.delete(vehicle)
    await db.commit()


async def _get_owned_vehicle(db: AsyncSession, vehicle_id: int, user: User) -> Vehicle:
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if user.role != UserRole.ADMIN and vehicle.rental_company_id != user.id:
        raise HTTPException(status_code=403, detail="Not your vehicle")
    return vehicle


# ── Driver profile ───────────────────────────────────────────────────────────


@router.get("/driver-profile", response_model=DriverProfileResponse)
async def get_driver_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DRIVER, UserRole.GUIDE])),
):
    result = await db.execute(
        select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    if profile is None:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return profile


@router.put("/driver-profile", response_model=DriverProfileResponse)
async def upsert_driver_profile(
    body: DriverProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DRIVER, UserRole.GUIDE])),
):
    result = await db.execute(
        select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    data = body.model_dump(exclude_unset=True)
    if profile is None:
        name = data.get("name") or current_user.full_name or current_user.email
        profile = DriverProfile(
            user_id=current_user.id,
            name=name,
            profile_picture_url=data.get("profile_picture_url", ""),
            license_number=data.get("license_number", ""),
            license_expiry=data.get("license_expiry", ""),
            languages=data.get("languages", []),
            experience_level=data.get("experience_level", ""),
            location=data.get("location", ""),
            availability_ranges=data.get("availability_ranges", []),
            provider_association=data.get("provider_association", ""),
            documents=data.get("documents", []),
            guiding_day_rate=data.get("guiding_day_rate", 0),
            driving_day_rate=data.get("driving_day_rate", 0),
        )
        db.add(profile)
    else:
        _apply_update(profile, data)
    await db.commit()
    await db.refresh(profile)
    return profile
