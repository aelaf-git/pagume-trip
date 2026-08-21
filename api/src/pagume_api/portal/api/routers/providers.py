from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from pagume_api.portal.api.deps import get_current_active_user, get_db, require_role
from pagume_api.portal.db.models.ops import (
    Notification,
    PortalBooking,
    PortalPayment,
    PortalReview,
)
from pagume_api.portal.db.models.provider import (
    DriverProfile,
    Hotel,
    Room,
    TourPackage,
    Vehicle,
)
from pagume_api.portal.db.models.user import User, UserRole
from pagume_api.portal.sync_agent import (
    sync_portal_hotel_availability,
    sync_portal_tour_availability,
    sync_portal_vehicle_availability,
)
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
from pagume_api.portal.schemas.ops import (
    NotificationResponse,
    PortalBookingCreate,
    PortalBookingResponse,
    PortalPaymentResponse,
    PortalReviewResponse,
    ProviderDashboardStats,
)

router = APIRouter()


def _apply_update(obj, data: dict) -> None:
    for key, value in data.items():
        if value is not None:
            setattr(obj, key, value)


async def _sync_hotel_rooms_to_agent(db: AsyncSession, hotel_id: int) -> None:
    def _run(sync_session) -> None:
        hotel = sync_session.get(Hotel, hotel_id)
        if hotel is None:
            return
        rooms = list(
            sync_session.scalars(select(Room).where(Room.hotel_id == hotel_id)).all()
        )
        sync_portal_hotel_availability(sync_session, hotel, rooms)

    await db.run_sync(_run)


async def _sync_vehicle_to_agent(db: AsyncSession, vehicle_id: int) -> None:
    def _run(sync_session) -> None:
        vehicle = sync_session.get(Vehicle, vehicle_id)
        if vehicle is None:
            return
        sync_portal_vehicle_availability(sync_session, vehicle)

    await db.run_sync(_run)


async def _sync_tour_to_agent(db: AsyncSession, tour_id: int) -> None:
    def _run(sync_session) -> None:
        tour = sync_session.get(TourPackage, tour_id)
        if tour is None:
            return
        sync_portal_tour_availability(sync_session, tour)

    await db.run_sync(_run)


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
    await _sync_hotel_rooms_to_agent(db, hotel_id)
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
    await db.flush()
    await _sync_hotel_rooms_to_agent(db, hotel.id)
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
    await db.flush()
    await _sync_hotel_rooms_to_agent(db, hotel_id)
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
    await db.flush()
    await _sync_hotel_rooms_to_agent(db, room.hotel_id)
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
    await db.flush()
    await _sync_hotel_rooms_to_agent(db, room.hotel_id)
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
    await db.flush()
    await _sync_tour_to_agent(db, tour.id)
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
    await db.flush()
    await _sync_tour_to_agent(db, tour.id)
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
    await db.flush()
    await _sync_tour_to_agent(db, tour.id)
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
    await db.flush()
    await _sync_vehicle_to_agent(db, vehicle.id)
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
    await db.flush()
    await _sync_vehicle_to_agent(db, vehicle.id)
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
    await db.flush()
    await _sync_vehicle_to_agent(db, vehicle.id)
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


# ── Bookings ─────────────────────────────────────────────────────────────────


@router.get("/bookings", response_model=List[PortalBookingResponse])
async def list_my_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(PortalBooking).where(PortalBooking.provider_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/bookings", response_model=PortalBookingResponse)
async def create_booking(
    body: PortalBookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    booking = PortalBooking(
        provider_id=current_user.id,
        **body.model_dump(),
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


@router.put("/bookings/{booking_id}/confirm", response_model=PortalBookingResponse)
async def confirm_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    booking = await _get_owned_booking(db, booking_id, current_user)
    booking.booking_status = "CONFIRMED"
    if booking.payment_status == "UNPAID":
        booking.payment_status = "PAID"
        db.add(
            PortalPayment(
                provider_id=current_user.id,
                booking_id=booking.id,
                amount=booking.price or 0,
                currency="ETB",
                status="COMPLETED",
                method="portal",
                reference=f"bk-{booking.id}",
            )
        )
    await db.commit()
    await db.refresh(booking)
    return booking


@router.put("/bookings/{booking_id}/cancel", response_model=PortalBookingResponse)
async def cancel_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    booking = await _get_owned_booking(db, booking_id, current_user)
    booking.booking_status = "CANCELLED"
    await db.commit()
    await db.refresh(booking)
    return booking


async def _get_owned_booking(
    db: AsyncSession, booking_id: int, user: User
) -> PortalBooking:
    result = await db.execute(select(PortalBooking).where(PortalBooking.id == booking_id))
    booking = result.scalars().first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if user.role != UserRole.ADMIN and booking.provider_id != user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    return booking


# ── Payments / reviews / notifications / dashboard ───────────────────────────


@router.get("/payments", response_model=List[PortalPaymentResponse])
async def list_my_payments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(PortalPayment).where(PortalPayment.provider_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/reviews", response_model=List[PortalReviewResponse])
async def list_my_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(PortalReview).where(PortalReview.provider_id == current_user.id)
    )
    return result.scalars().all()


@router.put("/reviews/{review_id}/hide", response_model=PortalReviewResponse)
async def hide_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(PortalReview).where(PortalReview.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.provider_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not your review")
    review.status = "HIDDEN"
    await db.commit()
    await db.refresh(review)
    return review


@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.id.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    note = result.scalars().first()
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    note.read = True
    await db.commit()
    await db.refresh(note)
    return note


@router.get("/dashboard/stats", response_model=ProviderDashboardStats)
async def provider_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    pid = current_user.id
    bookings_total = (
        await db.execute(
            select(func.count())
            .select_from(PortalBooking)
            .where(PortalBooking.provider_id == pid)
        )
    ).scalar() or 0
    bookings_pending = (
        await db.execute(
            select(func.count())
            .select_from(PortalBooking)
            .where(
                PortalBooking.provider_id == pid,
                PortalBooking.booking_status == "PENDING",
            )
        )
    ).scalar() or 0
    bookings_confirmed = (
        await db.execute(
            select(func.count())
            .select_from(PortalBooking)
            .where(
                PortalBooking.provider_id == pid,
                PortalBooking.booking_status == "CONFIRMED",
            )
        )
    ).scalar() or 0
    revenue = (
        await db.execute(
            select(func.coalesce(func.sum(PortalPayment.amount), 0.0)).where(
                PortalPayment.provider_id == pid,
                PortalPayment.status == "COMPLETED",
            )
        )
    ).scalar() or 0.0
    reviews = (
        await db.execute(
            select(PortalReview).where(
                PortalReview.provider_id == pid,
                PortalReview.status == "VISIBLE",
            )
        )
    ).scalars().all()
    avg = (
        sum(r.rating for r in reviews) / len(reviews) if reviews else 0.0
    )
    return ProviderDashboardStats(
        bookings_total=bookings_total,
        bookings_pending=bookings_pending,
        bookings_confirmed=bookings_confirmed,
        revenue=float(revenue),
        reviews_count=len(reviews),
        average_rating=round(avg, 2),
    )
