from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from pagume_api import models
from pagume_api.geo import date_range

HOLD_TTL = timedelta(minutes=15)


def expire_stale_holds(db: Session) -> None:
    cutoff = datetime.now(UTC).replace(tzinfo=None) - HOLD_TTL
    stale = db.scalars(
        select(models.RoomReservation).where(
            models.RoomReservation.status == "HOLD",
            models.RoomReservation.created_at < cutoff,
        )
    ).all()
    for row in stale:
        db.delete(row)
    if stale:
        db.flush()


def reserved_room_ids(db: Session, nights: list[str]) -> set[str]:
    expire_stale_holds(db)
    if not nights:
        return set()
    rows = db.scalars(
        select(models.RoomReservation.room_id).where(
            models.RoomReservation.day.in_(nights),
            models.RoomReservation.status.in_(("HOLD", "CONFIRMED")),
        )
    )
    return set(rows)


def hold_hotel_nights(
    db: Session,
    *,
    booking_id: str,
    hotel_id: str,
    room_id: str,
    check_in: str,
    check_out: str,
) -> None:
    expire_stale_holds(db)
    room = db.get(models.HotelRoom, room_id)
    if room is None or room.hotel_id != hotel_id:
        raise ValueError("Room does not belong to this hotel")
    nights = date_range(check_in, check_out)
    for day in nights:
        db.add(
            models.RoomReservation(
                room_id=room_id,
                day=day,
                booking_id=booking_id,
                status="HOLD",
            )
        )
    try:
        db.flush()
    except IntegrityError as exc:
        raise ConflictError("Room is no longer available for those dates") from exc


def confirm_hotel_nights(db: Session, booking_id: str) -> None:
    expire_stale_holds(db)
    booking = db.scalar(
        select(models.Booking)
        .options(selectinload(models.Booking.items))
        .where(models.Booking.id == booking_id)
    )
    hotel_items = [item for item in (booking.items if booking else []) if item.service_type == "hotel"]
    rows = list(
        db.scalars(
            select(models.RoomReservation).where(
                models.RoomReservation.booking_id == booking_id
            )
        )
    )
    if hotel_items and not rows:
        raise ConflictError("Hold expired; room is no longer available")
    for row in rows:
        row.status = "CONFIRMED"
    db.flush()


def release_hotel_nights(db: Session, booking_id: str) -> None:
    rows = list(
        db.scalars(
            select(models.RoomReservation).where(
                models.RoomReservation.booking_id == booking_id
            )
        )
    )
    for row in rows:
        db.delete(row)
    if rows:
        db.flush()


class ConflictError(Exception):
    """Room nights are taken or a hold expired."""
