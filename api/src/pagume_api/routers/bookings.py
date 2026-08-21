from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from pagume_api import models
from pagume_api.db import get_db
from pagume_api.reservations import (
    ConflictError,
    confirm_inventory_holds,
    hold_hotel_nights,
    hold_tour_nights,
    hold_vehicle_nights,
    release_inventory_holds,
)
from pagume_api.schemas import BookingOut, PrepareBookingIn
from pagume_api.serializers import booking_out

router = APIRouter(prefix="/v1/bookings", tags=["bookings"])


def _booking_query():
    return select(models.Booking).options(selectinload(models.Booking.items))


def _lookup_idempotency(db: Session, operation: str, key: str | None) -> models.Booking | None:
    if not key:
        return None
    record = db.scalar(
        select(models.IdempotencyKey).where(
            models.IdempotencyKey.operation == operation,
            models.IdempotencyKey.key == key,
        )
    )
    if record is None:
        return None
    return db.scalar(_booking_query().where(models.Booking.id == record.booking_id))


def _store_idempotency(db: Session, operation: str, key: str, booking_id: str) -> None:
    existing = db.scalar(
        select(models.IdempotencyKey).where(
            models.IdempotencyKey.operation == operation,
            models.IdempotencyKey.key == key,
        )
    )
    if existing is None:
        db.add(
            models.IdempotencyKey(operation=operation, key=key, booking_id=booking_id)
        )


@router.post("/prepare", response_model=BookingOut, status_code=201)
def prepare_booking(
    body: PrepareBookingIn,
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> BookingOut:
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Idempotency-Key header is required")
    cached = _lookup_idempotency(db, "prepare", idempotency_key)
    if cached is not None:
        return booking_out(cached)
    total = sum(item.price_etb for item in body.items)
    booking = models.Booking(
        id=f"bkg_{uuid4().hex[:8]}",
        user_id=body.user_id,
        price_etb=total,
        status="PENDING",
        payment_status="UNPAID",
        idempotency_key=idempotency_key,
    )
    db.add(booking)
    db.flush()
    for item in body.items:
        db.add(
            models.BookingItem(
                booking_id=booking.id,
                service_type=item.service_type,
                entity_id=item.entity_id,
                name=item.name,
                price_etb=item.price_etb,
                currency=item.currency,
                room_id=item.room_id,
                check_in=item.check_in,
                check_out=item.check_out,
            )
        )
        if item.service_type == "hotel":
            if not item.room_id or not item.check_in or not item.check_out:
                raise HTTPException(
                    status_code=400,
                    detail="Hotel items require room_id, check_in, and check_out",
                )
            try:
                hold_hotel_nights(
                    db,
                    booking_id=booking.id,
                    hotel_id=item.entity_id,
                    room_id=item.room_id,
                    check_in=item.check_in,
                    check_out=item.check_out,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
            except ConflictError as exc:
                raise HTTPException(status_code=409, detail=str(exc)) from exc
        elif item.service_type == "vehicle":
            if not item.check_in or not item.check_out:
                raise HTTPException(
                    status_code=400,
                    detail="Vehicle items require check_in and check_out",
                )
            try:
                hold_vehicle_nights(
                    db,
                    booking_id=booking.id,
                    vehicle_id=item.entity_id,
                    check_in=item.check_in,
                    check_out=item.check_out,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
            except ConflictError as exc:
                raise HTTPException(status_code=409, detail=str(exc)) from exc
        elif item.service_type == "tour":
            if not item.check_in:
                raise HTTPException(
                    status_code=400,
                    detail="Tour items require check_in",
                )
            try:
                hold_tour_nights(
                    db,
                    booking_id=booking.id,
                    tour_id=item.entity_id,
                    check_in=item.check_in,
                    check_out=item.check_out or item.check_in,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
            except ConflictError as exc:
                raise HTTPException(status_code=409, detail=str(exc)) from exc
    _store_idempotency(db, "prepare", idempotency_key, booking.id)
    db.flush()
    booking = db.scalar(_booking_query().where(models.Booking.id == booking.id))
    return booking_out(booking)


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: str, db: Session = Depends(get_db)) -> BookingOut:
    booking = db.scalar(_booking_query().where(models.Booking.id == booking_id))
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking_out(booking)


@router.post("/{booking_id}/confirm", response_model=BookingOut)
def confirm_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> BookingOut:
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Idempotency-Key header is required")
    cached = _lookup_idempotency(db, "confirm", idempotency_key)
    if cached is not None:
        return booking_out(cached)
    booking = db.scalar(_booking_query().where(models.Booking.id == booking_id))
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "CONFIRMED":
        try:
            confirm_inventory_holds(db, booking.id)
        except ConflictError as exc:
            booking.status = "FAILED"
            db.flush()
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        booking.status = "CONFIRMED"
        booking.payment_status = "AUTHORIZED"
        booking.confirmation_code = f"PT-{booking.id[-5:].upper()}"
    _store_idempotency(db, "confirm", idempotency_key, booking.id)
    db.flush()
    return booking_out(booking)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> BookingOut:
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Idempotency-Key header is required")
    cached = _lookup_idempotency(db, "cancel", idempotency_key)
    if cached is not None:
        return booking_out(cached)
    booking = db.scalar(_booking_query().where(models.Booking.id == booking_id))
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    release_inventory_holds(db, booking.id)
    booking.status = "CANCELLED"
    _store_idempotency(db, "cancel", idempotency_key, booking.id)
    db.flush()
    return booking_out(booking)
