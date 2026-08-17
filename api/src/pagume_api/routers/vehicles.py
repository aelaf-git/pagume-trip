from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from pagume_api import models
from pagume_api.db import get_db
from pagume_api.geo import date_range
from pagume_api.schemas import Results, VehicleCreate, VehicleOut
from pagume_api.serializers import vehicle_out

transport_router = APIRouter(prefix="/v1/transport", tags=["transport"])
rentals_router = APIRouter(prefix="/v1/car-rentals", tags=["car-rentals"])
vehicles_router = APIRouter(prefix="/v1/vehicles", tags=["vehicles"])


def _vehicles_query():
    return select(models.Vehicle).options(selectinload(models.Vehicle.availability))


def _filter_vehicles(
    db: Session,
    *,
    destination_id: str,
    seats: int | None = None,
    service_type: str | None = None,
    is_4wd: bool | None = None,
) -> list[VehicleOut]:
    vehicles = list(
        db.scalars(
            _vehicles_query().where(
                models.Vehicle.destination_id == destination_id,
                models.Vehicle.provider_status == "VERIFIED",
            )
        )
    )
    results: list[VehicleOut] = []
    for vehicle in vehicles:
        if seats is not None and vehicle.seats < seats:
            continue
        if service_type and vehicle.service_type != service_type:
            continue
        if is_4wd is not None and vehicle.is_4wd != is_4wd:
            continue
        results.append(vehicle_out(vehicle))
    return results


@transport_router.get("", response_model=Results)
def search_transport(
    destination_id: str,
    seats: int | None = None,
    service_type: str | None = None,
    db: Session = Depends(get_db),
) -> Results:
    return Results(
        results=_filter_vehicles(
            db, destination_id=destination_id, seats=seats, service_type=service_type
        )
    )


@transport_router.post("", response_model=VehicleOut, status_code=201)
def create_vehicle(body: VehicleCreate, db: Session = Depends(get_db)) -> VehicleOut:
    if db.get(models.Destination, body.destination_id) is None:
        raise HTTPException(status_code=400, detail="Unknown destination_id")
    if db.get(models.Vehicle, body.id):
        raise HTTPException(status_code=409, detail="Vehicle already exists")
    data = body.model_dump()
    dates = data.pop("available_dates")
    vehicle = models.Vehicle(**data)
    db.add(vehicle)
    db.flush()
    for day in dates:
        db.add(models.VehicleAvailability(vehicle_id=vehicle.id, day=day))
    db.flush()
    vehicle = db.scalar(_vehicles_query().where(models.Vehicle.id == vehicle.id))
    return vehicle_out(vehicle)


@rentals_router.get("", response_model=Results)
def search_car_rentals(
    destination_id: str,
    seats: int | None = None,
    is_4wd: bool | None = None,
    db: Session = Depends(get_db),
) -> Results:
    return Results(
        results=_filter_vehicles(
            db, destination_id=destination_id, seats=seats, is_4wd=is_4wd
        )
    )


@vehicles_router.get("/{vehicle_id}/availability")
def check_vehicle_availability(
    vehicle_id: str,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
) -> dict:
    vehicle = db.scalar(_vehicles_query().where(models.Vehicle.id == vehicle_id))
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    needed = date_range(start_date, end_date)
    available = {item.day for item in vehicle.availability}
    return {"available": all(day in available for day in needed)}
