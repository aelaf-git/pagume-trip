from pagume_api import models
from pagume_api.schemas import (
    BookingItemIn,
    BookingOut,
    DestinationOut,
    HotelOut,
    HotelRoomOut,
    ItineraryItemIn,
    TourPackageOut,
    TripOut,
    VehicleOut,
)


def destination_out(row: models.Destination) -> DestinationOut:
    return DestinationOut.model_validate(row)


def hotel_out(row: models.Hotel) -> HotelOut:
    return HotelOut(
        id=row.id,
        destination_id=row.destination_id,
        name=row.name,
        description=row.description,
        property_type=row.property_type,
        latitude=row.latitude,
        longitude=row.longitude,
        amenities=row.amenities or [],
        rating=row.rating,
        comfort_level=row.comfort_level,
        check_in_time=row.check_in_time,
        check_out_time=row.check_out_time,
        provider_status=row.provider_status,
        rooms=[HotelRoomOut.model_validate(room) for room in row.rooms],
        available_dates=sorted(item.day for item in row.availability),
    )


def room_out(row: models.HotelRoom) -> HotelRoomOut:
    return HotelRoomOut.model_validate(row)


def vehicle_out(row: models.Vehicle) -> VehicleOut:
    return VehicleOut(
        id=row.id,
        destination_id=row.destination_id,
        name=row.name,
        make=row.make,
        model=row.model,
        year=row.year,
        seats=row.seats,
        transmission=row.transmission,
        fuel_type=row.fuel_type,
        is_4wd=row.is_4wd,
        daily_price_etb=row.daily_price_etb,
        weekly_price_etb=row.weekly_price_etb,
        deposit_etb=row.deposit_etb,
        insurance=row.insurance,
        driver_included=row.driver_included,
        service_type=row.service_type,
        pickup_location=row.pickup_location,
        provider_status=row.provider_status,
        available_dates=sorted(item.day for item in row.availability),
        currency=row.currency,
    )


def tour_out(row: models.TourPackage) -> TourPackageOut:
    return TourPackageOut(
        id=row.id,
        destination_id=row.destination_id,
        agency_id=row.agency_id,
        name=row.name,
        description=row.description,
        duration_hours=row.duration_hours,
        duration_days=row.duration_days,
        price_etb=row.price_etb,
        currency=row.currency,
        max_participants=row.max_participants,
        min_participants=row.min_participants,
        included=row.included or [],
        excluded=row.excluded or [],
        category=row.category,
        seats_remaining=row.seats_remaining,
        provider_status=row.provider_status,
        available_dates=sorted(item.day for item in row.availability),
    )


def trip_out(row: models.Trip) -> TripOut:
    return TripOut(
        id=row.id,
        user_id=row.user_id,
        destination_id=row.destination_id,
        status=row.status,
        option=row.option,
        itinerary=[
            ItineraryItemIn(
                day=item.day,
                time=item.time,
                title=item.title,
                description=item.description,
                entity_type=item.entity_type,
                entity_id=item.entity_id,
            )
            for item in row.itinerary
        ],
        booking_ids=row.booking_ids or [],
        total_etb=row.total_etb,
        currency=row.currency,
    )


def booking_out(row: models.Booking) -> BookingOut:
    return BookingOut(
        id=row.id,
        user_id=row.user_id,
        provider_id=row.provider_id,
        items=[
            BookingItemIn(
                service_type=item.service_type,
                entity_id=item.entity_id,
                name=item.name,
                price_etb=item.price_etb,
                currency=item.currency,
                room_id=item.room_id,
                check_in=item.check_in,
                check_out=item.check_out,
            )
            for item in row.items
        ],
        price_etb=row.price_etb,
        currency=row.currency,
        status=row.status,
        payment_status=row.payment_status,
        confirmation_code=row.confirmation_code,
        idempotency_key=row.idempotency_key,
        cancellation_policy=row.cancellation_policy,
    )
