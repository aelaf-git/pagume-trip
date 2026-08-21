from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from pagume_api import models
from pagume_api.db import get_db
from pagume_api.geo import destination_search_rank, haversine_km
from pagume_api.schemas import DestinationCreate, DestinationOut, Results
from pagume_api.serializers import destination_out

router = APIRouter(prefix="/v1/destinations", tags=["destinations"])


@router.get("", response_model=Results)
def search_destinations(
    q: str | None = Query(default=None),
    region: str | None = None,
    db: Session = Depends(get_db),
) -> Results:
    stmt = select(models.Destination).where(
        models.Destination.verification_status == "VERIFIED"
    )
    rows = list(db.scalars(stmt))
    query = (q or "").strip().lower()
    scored: list[tuple[int, DestinationOut]] = []
    for dest in rows:
        haystack = " ".join(
            [dest.name, dest.description, dest.region, dest.zone, dest.woreda or ""]
        )
        rank = destination_search_rank(dest.name, haystack, query)
        if rank is None:
            continue
        if region and region.lower() not in dest.region.lower():
            continue
        scored.append((rank, destination_out(dest)))
    scored.sort(key=lambda item: (item[0], item[1].name))
    return Results(results=[row for _, row in scored])


@router.post("", response_model=DestinationOut, status_code=201)
def create_destination(body: DestinationCreate, db: Session = Depends(get_db)) -> DestinationOut:
    if db.get(models.Destination, body.id):
        raise HTTPException(status_code=409, detail="Destination already exists")
    row = models.Destination(**body.model_dump())
    db.add(row)
    db.flush()
    return destination_out(row)


@router.get("/{destination_id}", response_model=DestinationOut)
def get_destination(destination_id: str, db: Session = Depends(get_db)) -> DestinationOut:
    row = db.get(models.Destination, destination_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Destination not found")
    return destination_out(row)


@router.get("/{destination_id}/nearby", response_model=Results)
def nearby_destinations(
    destination_id: str,
    radius_km: float = 100,
    db: Session = Depends(get_db),
) -> Results:
    origin = db.get(models.Destination, destination_id)
    if origin is None:
        raise HTTPException(status_code=404, detail="Destination not found")
    results = []
    for dest in db.scalars(select(models.Destination)).all():
        if dest.id == origin.id:
            continue
        distance = haversine_km(
            origin.latitude, origin.longitude, dest.latitude, dest.longitude
        )
        if distance <= radius_km:
            results.append(destination_out(dest))
    return Results(results=results)
