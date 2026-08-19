from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from src.api.deps import get_current_active_user, get_db
from src.db.models.user import User, UserRole
from src.db.models.booking import Booking, BookingStatus, BookingItemType
from src.db.models.provider import Room, Vehicle, TourPackage

router = APIRouter()

@router.post("/")
async def create_booking(
    item_type: BookingItemType,
    item_id: int,
    check_in: str,
    check_out: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Travelers can create a booking for a Room, Vehicle, or TourPackage.
    The booking is created with a PENDING status, waiting for provider approval.
    """
    if current_user.role != UserRole.TRAVELER:
        raise HTTPException(status_code=403, detail="Only travelers can book inventory.")

    # 1. Fetch the item to get the price and provider_id
    price = 0
    provider_id = None
    
    if item_type == BookingItemType.ROOM:
        result = await db.execute(select(Room).where(Room.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Room not found")
        # Need to fetch the hotel to get the provider_id
        # In a real app we would join this
        from src.db.models.provider import Hotel
        hotel_res = await db.execute(select(Hotel).where(Hotel.id == item.hotel_id))
        hotel = hotel_res.scalar_one_or_none()
        price = item.price_per_night
        provider_id = hotel.provider_id
        
    elif item_type == BookingItemType.VEHICLE:
        result = await db.execute(select(Vehicle).where(Vehicle.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        price = item.daily_price
        provider_id = item.rental_company_id
        
    elif item_type == BookingItemType.TOUR_PACKAGE:
        result = await db.execute(select(TourPackage).where(TourPackage.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Tour package not found")
        price = item.price
        provider_id = item.agency_id

    # 2. Check AvailabilityBlock to ensure no overlap (Simplistic check)
    from src.db.models.booking import AvailabilityBlock
    # TODO: Perform ST_Overlaps or basic date overlap checking here.

    # 3. Create the Booking
    from datetime import datetime
    try:
        check_in_date = datetime.strptime(check_in, "%Y-%m-%d").date()
        check_out_date = datetime.strptime(check_out, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    new_booking = Booking(
        traveler_id=current_user.id,
        provider_id=provider_id,
        item_type=item_type,
        item_id=item_id,
        status=BookingStatus.PENDING,
        total_price=price, # NOTE: Simplistic price, real logic would multiply by days
        check_in_date=check_in_date,
        check_out_date=check_out_date
    )
    
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)
    
    return {"message": "Booking created successfully, awaiting provider approval", "booking_id": new_booking.id}

@router.put("/{booking_id}/status")
async def update_booking_status(
    booking_id: int,
    status: BookingStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Providers can approve (CONFIRMED) or reject (REJECTED) a booking request.
    """
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.provider_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this booking")
        
    booking.status = status
    await db.commit()
    
    return {"message": f"Booking status updated to {status.value}"}
