from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy.orm import Session

from pagume_api import models

SEED_DIR = Path(__file__).resolve().parents[2] / "data" / "seed"


def _load(name: str) -> list[dict]:
    path = SEED_DIR / name
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _set_dates(session: Session, model, fk_name: str, fk_value: str, dates: list[str]) -> None:
    session.query(model).filter(getattr(model, fk_name) == fk_value).delete()
    for day in dates:
        session.add(model(**{fk_name: fk_value, "day": day}))


def seed_if_empty(session: Session) -> None:
    """Insert any seed rows that are not already in the database."""
    seed_all(session)


def seed_all(session: Session) -> None:
    for row in _load("destinations.json"):
        if session.get(models.Destination, row["id"]):
            continue
        session.add(models.Destination(**row))
    session.flush()

    for row in _load("hotels.json"):
        rooms = row.pop("rooms", [])
        dates = row.pop("available_dates", [])
        if session.get(models.Hotel, row["id"]) is None:
            session.add(models.Hotel(**row))
            session.flush()
        for room in rooms:
            if session.get(models.HotelRoom, room["id"]) is None:
                session.add(models.HotelRoom(**room))
        _set_dates(session, models.HotelAvailability, "hotel_id", row["id"], dates)

    for row in _load("vehicles.json"):
        dates = row.pop("available_dates", [])
        if session.get(models.Vehicle, row["id"]) is None:
            session.add(models.Vehicle(**row))
            session.flush()
        _set_dates(session, models.VehicleAvailability, "vehicle_id", row["id"], dates)

    for row in _load("tours.json"):
        dates = row.pop("available_dates", [])
        if session.get(models.TourPackage, row["id"]) is None:
            session.add(models.TourPackage(**row))
            session.flush()
        _set_dates(session, models.TourAvailability, "tour_id", row["id"], dates)
    session.flush()

    # Sync MainDestination to Portal Destination
    from pagume_api.portal.db.models.destination import Destination as PortalDestination
    
    main_destinations = session.query(models.Destination).all()
    portal_destinations = session.query(PortalDestination).all()
    portal_names = {d.name.lower() for d in portal_destinations}
    
    for main_dest in main_destinations:
        if main_dest.name.lower() not in portal_names:
            session.add(PortalDestination(
                name=main_dest.name,
                description=main_dest.description,
                region=main_dest.region,
                zone=main_dest.zone,
                latitude=main_dest.latitude,
                longitude=main_dest.longitude,
                category=main_dest.category,
                verification_status=main_dest.verification_status,
                status="ACTIVE",
                images=[],
            ))
    session.flush()
