"""Sync portal inventory availability into agent-facing tables.

Agents read main inventory (`hotels`, `hotel_availability`, `room_reservations`, …).
Portal calendar edits write portal `availability_dates` JSON; this module mirrors
those statuses so search/hold APIs hide booked or blocked nights.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from pagume_api import models


def agent_hotel_id(portal_hotel_id: int) -> str:
    return f"portal_hotel_{portal_hotel_id}"


def agent_room_id(portal_room_id: int) -> str:
    return f"portal_room_{portal_room_id}"


def agent_vehicle_id(portal_vehicle_id: int) -> str:
    return f"portal_vehicle_{portal_vehicle_id}"


def agent_tour_id(portal_tour_id: int) -> str:
    return f"portal_tour_{portal_tour_id}"


def _parse_entries(raw: list | None) -> dict[str, str]:
    """date -> status (available|booked|reserved|blocked)."""
    out: dict[str, str] = {}
    for entry in raw or []:
        if isinstance(entry, str):
            out[entry] = "available"
        elif isinstance(entry, dict) and entry.get("date"):
            status = str(entry.get("status") or "available").lower()
            out[str(entry["date"])] = status
    return out


def _pick_destination_id(session: Session, portal_hotel: Any) -> str:
    # Prefer Bahir Dar / Gorgora for lake resorts; else first destination.
    preferred = ("dest_bahir_dar", "dest_gorgora")
    for dest_id in preferred:
        if session.get(models.Destination, dest_id):
            return dest_id
    row = session.scalars(select(models.Destination).limit(1)).first()
    if row is None:
        dest = models.Destination(
            id="dest_portal_default",
            name="Portal Default",
            description="Auto-created for portal inventory sync",
            region="",
            zone="",
            latitude=float(portal_hotel.latitude or 0),
            longitude=float(portal_hotel.longitude or 0),
            category="destination",
            verification_status="VERIFIED",
        )
        session.add(dest)
        session.flush()
        return dest.id
    return row.id


def _ensure_calendar_booking(session: Session, booking_id: str, provider_id: str) -> None:
    if session.get(models.Booking, booking_id) is None:
        session.add(
            models.Booking(
                id=booking_id,
                user_id="portal_calendar",
                provider_id=provider_id,
                price_etb=0,
                currency="ETB",
                status="CONFIRMED",
                payment_status="PAID",
                confirmation_code=booking_id[:16],
                cancellation_policy="Portal calendar block",
            )
        )
        session.flush()


def ensure_agent_hotel(session: Session, portal_hotel: Any) -> models.Hotel:
    hid = agent_hotel_id(portal_hotel.id)
    hotel = session.get(models.Hotel, hid)
    dest_id = _pick_destination_id(session, portal_hotel)
    amenities = portal_hotel.amenities if isinstance(portal_hotel.amenities, list) else []
    if hotel is None:
        hotel = models.Hotel(
            id=hid,
            destination_id=dest_id,
            name=portal_hotel.name,
            description=portal_hotel.description or "",
            property_type="resort",
            latitude=float(portal_hotel.latitude or 0),
            longitude=float(portal_hotel.longitude or 0),
            amenities=amenities,
            rating=4.0,
            comfort_level="standard",
            check_in_time=portal_hotel.check_in_time or "14:00",
            check_out_time=portal_hotel.check_out_time or "11:00",
            provider_status="VERIFIED",
        )
        session.add(hotel)
        session.flush()
    else:
        hotel.name = portal_hotel.name
        hotel.description = portal_hotel.description or ""
        hotel.latitude = float(portal_hotel.latitude or hotel.latitude or 0)
        hotel.longitude = float(portal_hotel.longitude or hotel.longitude or 0)
        hotel.amenities = amenities
        hotel.check_in_time = portal_hotel.check_in_time or hotel.check_in_time
        hotel.check_out_time = portal_hotel.check_out_time or hotel.check_out_time
        hotel.provider_status = "VERIFIED"
    return hotel


def ensure_agent_room(
    session: Session, portal_room: Any, agent_hotel: models.Hotel
) -> models.HotelRoom:
    rid = agent_room_id(portal_room.id)
    room = session.get(models.HotelRoom, rid)
    amenities = portal_room.amenities if isinstance(portal_room.amenities, list) else []
    if room is None:
        room = models.HotelRoom(
            id=rid,
            hotel_id=agent_hotel.id,
            room_type=portal_room.room_type,
            description=portal_room.description or "",
            capacity=int(portal_room.capacity or 2),
            beds=int(portal_room.beds or 1),
            amenities=amenities,
            nightly_price_etb=float(portal_room.price_per_night or 0),
            currency="ETB",
        )
        session.add(room)
        session.flush()
    else:
        room.room_type = portal_room.room_type
        room.description = portal_room.description or ""
        room.capacity = int(portal_room.capacity or 2)
        room.beds = int(portal_room.beds or 1)
        room.amenities = amenities
        room.nightly_price_etb = float(portal_room.price_per_night or 0)
    return room


def sync_portal_hotel_availability(session: Session, portal_hotel: Any, portal_rooms: list) -> None:
    """Mirror portal rooms' availability_dates into agent hotel + room reservations."""
    agent_hotel = ensure_agent_hotel(session, portal_hotel)
    booking_id = f"portal_cal_{agent_hotel.id}"
    _ensure_calendar_booking(session, booking_id, provider_id=str(portal_hotel.provider_id))

    operating_days: set[str] = set()
    for portal_room in portal_rooms:
        agent_room = ensure_agent_room(session, portal_room, agent_hotel)
        entries = _parse_entries(portal_room.availability_dates)
        operating_days.update(entries.keys())

        # Clear prior portal-calendar reservations for this room, then re-apply.
        existing = session.scalars(
            select(models.RoomReservation).where(
                models.RoomReservation.room_id == agent_room.id,
                models.RoomReservation.booking_id == booking_id,
            )
        ).all()
        for row in existing:
            session.delete(row)
        session.flush()

        for day, status in entries.items():
            if status in {"booked", "reserved", "blocked"}:
                session.add(
                    models.RoomReservation(
                        room_id=agent_room.id,
                        day=day,
                        booking_id=booking_id,
                        status="CONFIRMED",
                    )
                )
        session.flush()

    # Replace hotel_availability with operating days from portal calendar.
    session.execute(
        delete(models.HotelAvailability).where(
            models.HotelAvailability.hotel_id == agent_hotel.id
        )
    )
    session.flush()
    for day in sorted(operating_days):
        session.add(models.HotelAvailability(hotel_id=agent_hotel.id, day=day))
    session.flush()


def sync_portal_vehicle_availability(session: Session, portal_vehicle: Any) -> None:
    vid = agent_vehicle_id(portal_vehicle.id)
    dest_id = "dest_bahir_dar"
    if session.get(models.Destination, dest_id) is None:
        row = session.scalars(select(models.Destination).limit(1)).first()
        dest_id = row.id if row else "dest_portal_default"
        if row is None and session.get(models.Destination, dest_id) is None:
            session.add(
                models.Destination(
                    id=dest_id,
                    name="Portal Default",
                    description="",
                    region="",
                    zone="",
                    latitude=0,
                    longitude=0,
                    category="destination",
                    verification_status="VERIFIED",
                )
            )
            session.flush()

    vehicle = session.get(models.Vehicle, vid)
    name = f"{portal_vehicle.make} {portal_vehicle.model}".strip()
    pickup = (
        ", ".join(portal_vehicle.pickup_locations or [])
        if isinstance(portal_vehicle.pickup_locations, list)
        else (portal_vehicle.pickup_locations or "")
    )
    if vehicle is None:
        vehicle = models.Vehicle(
            id=vid,
            destination_id=dest_id,
            name=name or f"Vehicle {portal_vehicle.id}",
            make=portal_vehicle.make or "Unknown",
            model=portal_vehicle.model or "Unknown",
            year=portal_vehicle.year,
            seats=int(portal_vehicle.seats or 4),
            transmission=portal_vehicle.transmission or "manual",
            fuel_type=portal_vehicle.fuel_type or "diesel",
            is_4wd=bool(portal_vehicle.is_4wd),
            daily_price_etb=float(portal_vehicle.daily_price or 0),
            weekly_price_etb=portal_vehicle.weekly_price,
            deposit_etb=float(portal_vehicle.deposit or 0),
            insurance=portal_vehicle.insurance_details or "",
            driver_included=bool(portal_vehicle.driver_available),
            service_type=portal_vehicle.category or "car",
            pickup_location=pickup,
            provider_status="VERIFIED",
            currency="ETB",
        )
        session.add(vehicle)
        session.flush()
    else:
        vehicle.name = name or vehicle.name
        vehicle.make = portal_vehicle.make or "Unknown"
        vehicle.model = portal_vehicle.model or "Unknown"
        vehicle.year = portal_vehicle.year
        vehicle.seats = int(portal_vehicle.seats or 4)
        vehicle.transmission = portal_vehicle.transmission or "manual"
        vehicle.fuel_type = portal_vehicle.fuel_type or "diesel"
        vehicle.is_4wd = bool(portal_vehicle.is_4wd)
        vehicle.daily_price_etb = float(portal_vehicle.daily_price or 0)
        vehicle.weekly_price_etb = portal_vehicle.weekly_price
        vehicle.deposit_etb = float(portal_vehicle.deposit or 0)
        vehicle.insurance = portal_vehicle.insurance_details or ""
        vehicle.driver_included = bool(portal_vehicle.driver_available)
        vehicle.service_type = portal_vehicle.category or "car"
        vehicle.pickup_location = pickup
        vehicle.provider_status = "VERIFIED"
        session.flush()

    booking_id = f"portal_cal_{vid}"
    _ensure_calendar_booking(
        session, booking_id, provider_id=str(portal_vehicle.rental_company_id)
    )
    entries = _parse_entries(portal_vehicle.availability_dates)

    session.execute(
        delete(models.VehicleAvailability).where(
            models.VehicleAvailability.vehicle_id == vid
        )
    )
    existing = session.scalars(
        select(models.VehicleReservation).where(
            models.VehicleReservation.vehicle_id == vid,
            models.VehicleReservation.booking_id == booking_id,
        )
    ).all()
    for row in existing:
        session.delete(row)
    session.flush()

    for day, status in entries.items():
        session.add(models.VehicleAvailability(vehicle_id=vid, day=day))
        if status in {"booked", "reserved", "blocked"}:
            session.add(
                models.VehicleReservation(
                    vehicle_id=vid,
                    day=day,
                    booking_id=booking_id,
                    status="CONFIRMED",
                )
            )
    session.flush()


def delete_portal_vehicle_from_agent(session: Session, portal_vehicle_id: int) -> None:
    """Remove mirrored agent vehicle rows for a deleted portal fleet item."""
    vid = agent_vehicle_id(portal_vehicle_id)
    booking_id = f"portal_cal_{vid}"
    session.execute(
        delete(models.VehicleReservation).where(models.VehicleReservation.vehicle_id == vid)
    )
    session.execute(
        delete(models.VehicleAvailability).where(models.VehicleAvailability.vehicle_id == vid)
    )
    vehicle = session.get(models.Vehicle, vid)
    if vehicle is not None:
        session.delete(vehicle)
    booking = session.get(models.Booking, booking_id)
    if booking is not None:
        session.delete(booking)
    session.flush()


def sync_portal_tour_availability(session: Session, portal_tour: Any) -> None:
    tid = agent_tour_id(portal_tour.id)
    dest_id = "dest_bahir_dar"
    if session.get(models.Destination, dest_id) is None:
        row = session.scalars(select(models.Destination).limit(1)).first()
        dest_id = row.id if row else "dest_portal_default"

    tour = session.get(models.TourPackage, tid)
    if tour is None:
        tour = models.TourPackage(
            id=tid,
            destination_id=dest_id,
            agency_id=str(portal_tour.agency_id),
            name=portal_tour.name,
            description=portal_tour.description or "",
            duration_days=portal_tour.duration_days,
            price_etb=float(portal_tour.price or 0),
            currency="ETB",
            max_participants=int(portal_tour.max_participants or 12),
            min_participants=int(portal_tour.min_participants or 1),
            included=portal_tour.included_services or [],
            excluded=portal_tour.excluded_services or [],
            category=portal_tour.package_type or "tour",
            seats_remaining=int(portal_tour.max_participants or 8),
            provider_status="VERIFIED",
        )
        session.add(tour)
        session.flush()
    else:
        tour.agency_id = str(portal_tour.agency_id)
        tour.name = portal_tour.name
        tour.description = portal_tour.description or ""
        tour.duration_days = portal_tour.duration_days
        tour.price_etb = float(portal_tour.price or 0)
        tour.max_participants = int(portal_tour.max_participants or 12)
        tour.min_participants = int(portal_tour.min_participants or 1)
        tour.included = portal_tour.included_services or []
        tour.excluded = portal_tour.excluded_services or []
        tour.category = portal_tour.package_type or "tour"
        tour.seats_remaining = int(portal_tour.max_participants or 8)
        tour.provider_status = "VERIFIED"
        session.flush()

    booking_id = f"portal_cal_{tid}"
    _ensure_calendar_booking(session, booking_id, provider_id=str(portal_tour.agency_id))
    entries = _parse_entries(portal_tour.availability_dates)

    session.execute(
        delete(models.TourAvailability).where(models.TourAvailability.tour_id == tid)
    )
    existing = session.scalars(
        select(models.TourReservation).where(
            models.TourReservation.tour_id == tid,
            models.TourReservation.booking_id == booking_id,
        )
    ).all()
    for row in existing:
        session.delete(row)
    session.flush()

    for day, status in entries.items():
        session.add(models.TourAvailability(tour_id=tid, day=day))
        if status in {"booked", "reserved", "blocked"}:
            session.add(
                models.TourReservation(
                    tour_id=tid,
                    day=day,
                    booking_id=booking_id,
                    status="CONFIRMED",
                )
            )
    session.flush()


def delete_portal_tour_from_agent(session: Session, portal_tour_id: int) -> None:
    """Remove mirrored agent tour rows for a deleted portal package."""
    tid = agent_tour_id(portal_tour_id)
    booking_id = f"portal_cal_{tid}"
    session.execute(
        delete(models.TourReservation).where(models.TourReservation.tour_id == tid)
    )
    session.execute(
        delete(models.TourAvailability).where(models.TourAvailability.tour_id == tid)
    )
    tour = session.get(models.TourPackage, tid)
    if tour is not None:
        session.delete(tour)
    booking = session.get(models.Booking, booking_id)
    if booking is not None:
        session.delete(booking)
    session.flush()
