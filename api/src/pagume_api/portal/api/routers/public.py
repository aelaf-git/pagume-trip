from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from pagume_api.portal.api.deps import get_db
from pagume_api.portal.db.models.destination import Destination
from pagume_api.portal.db.models.provider import (
    DriverProfile,
    Hotel,
    TourPackage,
    Vehicle,
)
from pagume_api.portal.db.models.user import User
from pagume_api.portal.schemas.destination import DestinationResponse
from pagume_api.portal.schemas.inventory import (
    DriverProfileResponse,
    HotelResponse,
    TourPackageResponse,
    VehicleResponse,
)

router = APIRouter()


def _has_date(dates: list | None, date: str | None) -> bool:
    if not date:
        return True
    return bool(dates) and date in dates


def _amenities_match(amenities: list | None, needed: str | None) -> bool:
    if not needed:
        return True
    needle = needed.lower()
    return any(needle in str(a).lower() for a in (amenities or []))


@router.get("/destinations", response_model=List[DestinationResponse])
async def search_destinations(
    q: Optional[str] = None,
    location: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Destination).where(Destination.status == "ACTIVE")
    text = q or location
    if text:
        like = f"%{text}%"
        stmt = stmt.where(
            Destination.name.ilike(like)
            | Destination.region.ilike(like)
            | Destination.zone.ilike(like)
        )
    if category:
        stmt = stmt.where(Destination.category.ilike(f"%{category}%"))
    result = await db.execute(stmt.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/hotels", response_model=List[HotelResponse])
async def search_hotels(
    q: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    category: Optional[str] = None,
    amenities: Optional[str] = None,
    provider_id: Optional[int] = None,
    date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Hotel)
        .options(selectinload(Hotel.rooms))
        .join(User, Hotel.provider_id == User.id)
        .where(User.is_verified.is_(True), User.is_active.is_(True))
    )
    if provider_id is not None:
        stmt = stmt.where(Hotel.provider_id == provider_id)
    text = q or location
    if text:
        like = f"%{text}%"
        stmt = stmt.where(Hotel.name.ilike(like) | Hotel.address.ilike(like))
    result = await db.execute(stmt)
    hotels = list(result.scalars().unique().all())
    filtered: list[Hotel] = []
    for hotel in hotels:
        if not _amenities_match(hotel.amenities, amenities):
            continue
        rooms = hotel.rooms or []
        if date and not any(_has_date(r.availability_dates, date) for r in rooms):
            continue
        if min_price is not None or max_price is not None:
            prices = [r.price_per_night for r in rooms]
            if not prices:
                continue
            low = min(prices)
            if min_price is not None and low < min_price:
                continue
            if max_price is not None and low > max_price:
                continue
        if category and category.lower() not in (hotel.name or "").lower():
            # soft filter — category not first-class on hotel
            pass
        filtered.append(hotel)
    return filtered[skip : skip + limit]


@router.get("/tours", response_model=List[TourPackageResponse])
async def search_tours(
    q: Optional[str] = None,
    location: Optional[str] = None,
    destination: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    category: Optional[str] = None,
    provider_id: Optional[int] = None,
    date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(TourPackage)
        .join(User, TourPackage.agency_id == User.id)
        .where(User.is_verified.is_(True), User.is_active.is_(True))
    )
    if provider_id is not None:
        stmt = stmt.where(TourPackage.agency_id == provider_id)
    text = q or location or destination
    if text:
        like = f"%{text}%"
        stmt = stmt.where(
            TourPackage.name.ilike(like) | TourPackage.destination.ilike(like)
        )
    if category:
        stmt = stmt.where(TourPackage.package_type == category)
    if min_price is not None:
        stmt = stmt.where(TourPackage.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(TourPackage.price <= max_price)
    result = await db.execute(stmt.offset(0).limit(500))
    tours = [
        t
        for t in result.scalars().all()
        if _has_date(t.availability_dates, date)
    ]
    return tours[skip : skip + limit]


@router.get("/vehicles", response_model=List[VehicleResponse])
async def search_vehicles(
    q: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    category: Optional[str] = None,
    provider_id: Optional[int] = None,
    date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Vehicle)
        .join(User, Vehicle.rental_company_id == User.id)
        .where(User.is_verified.is_(True), User.is_active.is_(True))
    )
    if provider_id is not None:
        stmt = stmt.where(Vehicle.rental_company_id == provider_id)
    if category:
        stmt = stmt.where(Vehicle.category.ilike(f"%{category}%"))
    if min_price is not None:
        stmt = stmt.where(Vehicle.daily_price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Vehicle.daily_price <= max_price)
    text = q or location
    result = await db.execute(stmt.offset(0).limit(500))
    vehicles = []
    for v in result.scalars().all():
        if text:
            hay = f"{v.make} {v.model} {' '.join(v.pickup_locations or [])}".lower()
            if text.lower() not in hay:
                continue
        if not _has_date(v.availability_dates, date):
            continue
        vehicles.append(v)
    return vehicles[skip : skip + limit]


@router.get("/drivers", response_model=List[DriverProfileResponse])
async def search_drivers(
    q: Optional[str] = None,
    location: Optional[str] = None,
    provider_id: Optional[int] = None,
    date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DriverProfile).where(DriverProfile.verification_status == "VERIFIED")
    if provider_id is not None:
        stmt = stmt.where(DriverProfile.user_id == provider_id)
    text = q or location
    if text:
        like = f"%{text}%"
        stmt = stmt.where(
            DriverProfile.name.ilike(like) | DriverProfile.location.ilike(like)
        )
    result = await db.execute(stmt.offset(0).limit(500))
    drivers = []
    for d in result.scalars().all():
        if date:
            ranges = d.availability_ranges or []
            if not any(
                (r.get("startDate") or r.get("start_date") or "")
                <= date
                <= (r.get("endDate") or r.get("end_date") or "")
                for r in ranges
            ):
                continue
        drivers.append(d)
    return drivers[skip : skip + limit]
