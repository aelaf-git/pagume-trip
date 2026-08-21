from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from pagume_api import models
from pagume_api.db import get_db
from pagume_api.schemas import ItineraryItemIn, TripIn, TripOut
from pagume_api.serializers import trip_out

router = APIRouter(prefix="/v1/trips", tags=["trips"])


def _trip_query():
    return select(models.Trip).options(selectinload(models.Trip.itinerary))


def _replace_itinerary(db: Session, trip: models.Trip, items: list[ItineraryItemIn]) -> None:
    trip.itinerary.clear()
    db.flush()
    for item in items:
        trip.itinerary.append(
            models.ItineraryItem(
                day=item.day,
                time=item.time,
                title=item.title,
                description=item.description,
                entity_type=item.entity_type,
                entity_id=item.entity_id,
            )
        )


@router.post("", response_model=TripOut, status_code=201)
def create_trip(body: TripIn, db: Session = Depends(get_db)) -> TripOut:
    trip_id = body.id.strip() if body.id else f"trip_{uuid4().hex[:8]}"
    option = body.option
    if hasattr(option, "model_dump"):
        option = option.model_dump()
    trip = models.Trip(
        id=trip_id,
        user_id=body.user_id,
        destination_id=body.destination_id,
        status=body.status,
        option=option,
        booking_ids=body.booking_ids,
        total_etb=body.total_etb,
        currency=body.currency,
    )
    db.add(trip)
    db.flush()
    trip = db.scalar(_trip_query().where(models.Trip.id == trip_id))
    _replace_itinerary(db, trip, body.itinerary)
    db.flush()
    return trip_out(trip)


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: str, db: Session = Depends(get_db)) -> TripOut:
    trip = db.scalar(_trip_query().where(models.Trip.id == trip_id))
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip_out(trip)


@router.put("/{trip_id}/itinerary", response_model=TripOut)
def update_itinerary(
    trip_id: str,
    items: list[ItineraryItemIn],
    db: Session = Depends(get_db),
) -> TripOut:
    trip = db.scalar(_trip_query().where(models.Trip.id == trip_id))
    if trip is None:
        trip = models.Trip(id=trip_id, status="DRAFT")
        db.add(trip)
        db.flush()
        trip = db.scalar(_trip_query().where(models.Trip.id == trip_id))
    _replace_itinerary(db, trip, items)
    db.flush()
    return trip_out(trip)
