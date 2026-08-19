from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from pagume_api import models
from pagume_api.db import get_db
from pagume_api.geo import date_range
from pagume_api.reservations import reserved_tour_ids
from pagume_api.schemas import Results, TourCreate, TourPackageOut
from pagume_api.serializers import tour_out

router = APIRouter(prefix="/v1/tours", tags=["tours"])


def _tours_query():
    return select(models.TourPackage).options(selectinload(models.TourPackage.availability))


@router.get("", response_model=Results)
def search_tours(
    destination_id: str,
    q: str | None = None,
    guests: int | None = None,
    check_in: str | None = None,
    check_out: str | None = None,
    db: Session = Depends(get_db),
) -> Results:
    tours = list(
        db.scalars(
            _tours_query().where(
                models.TourPackage.destination_id == destination_id,
                models.TourPackage.provider_status == "VERIFIED",
            )
        )
    )
    query = (q or "").strip().lower()
    needed = None
    if check_in:
        needed = date_range(check_in, check_out or check_in)
    taken = reserved_tour_ids(db, needed) if needed else set()
    results: list[TourPackageOut] = []
    for tour in tours:
        if guests is not None and (
            guests > tour.max_participants or guests > tour.seats_remaining
        ):
            continue
        haystack = " ".join(
            [tour.name, tour.description, tour.category, " ".join(tour.included or [])]
        ).lower()
        if query and query not in haystack:
            continue
        if needed:
            available = {item.day for item in tour.availability}
            if any(day not in available for day in needed):
                continue
            if tour.id in taken:
                continue
        results.append(tour_out(tour))
    return Results(results=results)


@router.post("", response_model=TourPackageOut, status_code=201)
def create_tour(body: TourCreate, db: Session = Depends(get_db)) -> TourPackageOut:
    if db.get(models.Destination, body.destination_id) is None:
        raise HTTPException(status_code=400, detail="Unknown destination_id")
    if db.get(models.TourPackage, body.id):
        raise HTTPException(status_code=409, detail="Tour already exists")
    data = body.model_dump()
    dates = data.pop("available_dates")
    tour = models.TourPackage(**data)
    db.add(tour)
    db.flush()
    for day in dates:
        db.add(models.TourAvailability(tour_id=tour.id, day=day))
    db.flush()
    tour = db.scalar(_tours_query().where(models.TourPackage.id == tour.id))
    return tour_out(tour)


@router.get("/{package_id}", response_model=TourPackageOut)
def get_tour(package_id: str, db: Session = Depends(get_db)) -> TourPackageOut:
    tour = db.scalar(_tours_query().where(models.TourPackage.id == package_id))
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour_out(tour)


@router.get("/{package_id}/availability")
def check_tour_availability(
    package_id: str,
    date: str,
    guests: int,
    db: Session = Depends(get_db),
) -> dict:
    tour = db.scalar(_tours_query().where(models.TourPackage.id == package_id))
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    days = {item.day for item in tour.availability}
    if date not in days:
        return {"available": False}
    if guests > tour.seats_remaining or guests > tour.max_participants:
        return {"available": False}
    return {"available": package_id not in reserved_tour_ids(db, [date])}
