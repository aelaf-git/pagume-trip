from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from pagume_api import models
from pagume_api.db import get_db
from pagume_api.geo import date_range
from pagume_api.schemas import HotelCreate, HotelOut, Results
from pagume_api.serializers import hotel_out, room_out

router = APIRouter(prefix="/v1/hotels", tags=["hotels"])


def _hotels_query(db: Session):
    return select(models.Hotel).options(
        selectinload(models.Hotel.rooms),
        selectinload(models.Hotel.availability),
    )


@router.get("", response_model=Results)
def search_hotels(
    destination_id: str,
    guests: int | None = None,
    max_price_etb: float | None = None,
    check_in: str | None = None,
    check_out: str | None = None,
    db: Session = Depends(get_db),
) -> Results:
    hotels = list(
        db.scalars(
            _hotels_query(db).where(
                models.Hotel.destination_id == destination_id,
                models.Hotel.provider_status == "VERIFIED",
            )
        )
    )
    results: list[HotelOut] = []
    needed = date_range(check_in, check_out) if check_in and check_out else None
    for hotel in hotels:
        rooms = list(hotel.rooms)
        if guests is not None:
            rooms = [r for r in rooms if r.capacity >= guests]
        if max_price_etb is not None:
            rooms = [r for r in rooms if r.nightly_price_etb <= max_price_etb]
        if not rooms:
            continue
        available = {item.day for item in hotel.availability}
        if needed and any(day not in available for day in needed):
            continue
        payload = hotel_out(hotel)
        payload.rooms = [room_out(r) for r in rooms]
        results.append(payload)
    return Results(results=results)


@router.post("", response_model=HotelOut, status_code=201)
def create_hotel(body: HotelCreate, db: Session = Depends(get_db)) -> HotelOut:
    if db.get(models.Destination, body.destination_id) is None:
        raise HTTPException(status_code=400, detail="Unknown destination_id")
    if db.get(models.Hotel, body.id):
        raise HTTPException(status_code=409, detail="Hotel already exists")
    data = body.model_dump()
    rooms = data.pop("rooms")
    dates = data.pop("available_dates")
    hotel = models.Hotel(**data)
    db.add(hotel)
    db.flush()
    for room in rooms:
        db.add(models.HotelRoom(**room))
    for day in dates:
        db.add(models.HotelAvailability(hotel_id=hotel.id, day=day))
    db.flush()
    hotel = db.scalar(_hotels_query(db).where(models.Hotel.id == hotel.id))
    return hotel_out(hotel)


@router.get("/{hotel_id}", response_model=HotelOut)
def get_hotel(hotel_id: str, db: Session = Depends(get_db)) -> HotelOut:
    hotel = db.scalar(_hotels_query(db).where(models.Hotel.id == hotel_id))
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel_out(hotel)


@router.get("/{hotel_id}/rooms", response_model=Results)
def search_rooms(
    hotel_id: str,
    guests: int | None = None,
    max_price_etb: float | None = None,
    db: Session = Depends(get_db),
) -> Results:
    hotel = db.scalar(_hotels_query(db).where(models.Hotel.id == hotel_id))
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    rooms = list(hotel.rooms)
    if guests is not None:
        rooms = [r for r in rooms if r.capacity >= guests]
    if max_price_etb is not None:
        rooms = [r for r in rooms if r.nightly_price_etb <= max_price_etb]
    return Results(results=[room_out(r) for r in rooms])


@router.get("/{hotel_id}/rooms/{room_id}/availability")
def check_room_availability(
    hotel_id: str,
    room_id: str,
    check_in: str,
    check_out: str,
    db: Session = Depends(get_db),
) -> dict:
    hotel = db.scalar(_hotels_query(db).where(models.Hotel.id == hotel_id))
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if not any(r.id == room_id for r in hotel.rooms):
        raise HTTPException(status_code=404, detail="Room not found")
    needed = date_range(check_in, check_out)
    available = {item.day for item in hotel.availability}
    return {"available": all(day in available for day in needed)}
