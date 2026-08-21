from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from pagume_api import models
from pagume_api.geo import date_range

HOLD_TTL = timedelta(minutes=15)

_HOLD_MODELS = (
    models.RoomReservation,
    models.VehicleReservation,
    models.TourReservation,
)


class ConflictError(Exception):
    """Inventory nights are taken or a hold expired."""


def expire_stale_holds(db: Session) -> None:
    cutoff = datetime.now(UTC).replace(tzinfo=None) - HOLD_TTL
    deleted = False
    for model in _HOLD_MODELS:
        stale = db.scalars(
            select(model).where(model.status == "HOLD", model.created_at < cutoff)
        ).all()
        for row in stale:
            db.delete(row)
            deleted = True
    if deleted:
        db.flush()


def _reserved_ids(db: Session, model, id_column, nights: list[str]) -> set[str]:
    expire_stale_holds(db)
    if not nights:
        return set()
    rows = db.scalars(
        select(id_column).where(
            model.day.in_(nights),
            model.status.in_(("HOLD", "CONFIRMED")),
        )
    )
    return set(rows)


def reserved_room_ids(db: Session, nights: list[str]) -> set[str]:
    return _reserved_ids(db, models.RoomReservation, models.RoomReservation.room_id, nights)


def reserved_vehicle_ids(db: Session, nights: list[str]) -> set[str]:
    return _reserved_ids(
        db, models.VehicleReservation, models.VehicleReservation.vehicle_id, nights
    )


def reserved_tour_ids(db: Session, nights: list[str]) -> set[str]:
    return _reserved_ids(db, models.TourReservation, models.TourReservation.tour_id, nights)


def _hold_days(db: Session, model, conflict_message: str, **fields) -> None:
    expire_stale_holds(db)
    db.add(model(**fields, status="HOLD"))
    try:
        db.flush()
    except IntegrityError as exc:
        raise ConflictError(conflict_message) from exc


def hold_hotel_nights(
    db: Session,
    *,
    booking_id: str,
    hotel_id: str,
    room_id: str,
    check_in: str,
    check_out: str,
) -> None:
    room = db.get(models.HotelRoom, room_id)
    if room is None or room.hotel_id != hotel_id:
        raise ValueError("Room does not belong to this hotel")
    for day in date_range(check_in, check_out):
        _hold_days(
            db,
            models.RoomReservation,
            "Room is no longer available for those dates",
            room_id=room_id,
            day=day,
            booking_id=booking_id,
        )


def hold_vehicle_nights(
    db: Session,
    *,
    booking_id: str,
    vehicle_id: str,
    check_in: str,
    check_out: str,
) -> None:
    if db.get(models.Vehicle, vehicle_id) is None:
        raise ValueError("Unknown vehicle")
    for day in date_range(check_in, check_out):
        _hold_days(
            db,
            models.VehicleReservation,
            "Vehicle is no longer available for those dates",
            vehicle_id=vehicle_id,
            day=day,
            booking_id=booking_id,
        )


def hold_tour_nights(
    db: Session,
    *,
    booking_id: str,
    tour_id: str,
    check_in: str,
    check_out: str,
) -> None:
    if db.get(models.TourPackage, tour_id) is None:
        raise ValueError("Unknown tour")
    for day in date_range(check_in, check_out):
        _hold_days(
            db,
            models.TourReservation,
            "Tour is no longer available for those dates",
            tour_id=tour_id,
            day=day,
            booking_id=booking_id,
        )


def confirm_inventory_holds(db: Session, booking_id: str) -> None:
    expire_stale_holds(db)
    booking = db.scalar(
        select(models.Booking)
        .options(selectinload(models.Booking.items))
        .where(models.Booking.id == booking_id)
    )
    items = booking.items if booking else []
    kinds = {item.service_type for item in items}
    rows = []
    for model in _HOLD_MODELS:
        rows.extend(
            db.scalars(select(model).where(model.booking_id == booking_id)).all()
        )
    needs_hold = bool(kinds & {"hotel", "vehicle", "tour"})
    if needs_hold and not rows:
        raise ConflictError("Hold expired; inventory is no longer available")
    for row in rows:
        row.status = "CONFIRMED"
    db.flush()


def release_inventory_holds(db: Session, booking_id: str) -> None:
    deleted = False
    for model in _HOLD_MODELS:
        for row in db.scalars(select(model).where(model.booking_id == booking_id)).all():
            db.delete(row)
            deleted = True
    if deleted:
        db.flush()


# Back-compat names used by hotel booking.
confirm_hotel_nights = confirm_inventory_holds
release_hotel_nights = release_inventory_holds
