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
    _seed_portal_samples(session)


def _seed_portal_samples(session: Session) -> None:
    """Sample portal users, pending profile, booking, payment, notification."""
    from datetime import datetime

    from pagume_api.portal.core.security import get_password_hash
    from pagume_api.portal.db.models.ops import (
        AgentRunLog,
        ModerationItem,
        Notification,
        PlatformSetting,
        PortalBooking,
        PortalPayment,
        PortalReview,
        ProviderProfile,
    )
    from pagume_api.portal.db.models.user import User, UserRole

    if session.query(User).filter(User.email == "admin@pagume.et").first() is None:
        session.add(
            User(
                email="admin@pagume.et",
                hashed_password=get_password_hash("password123"),
                full_name="Pagume Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
        )
        session.flush()

    hotel_user = session.query(User).filter(User.email == "hotel@seed.et").first()
    if hotel_user is None:
        hotel_user = User(
            email="hotel@seed.et",
            hashed_password=get_password_hash("password123"),
            full_name="Seed Hotel",
            role=UserRole.HOTEL_PROVIDER,
            is_active=True,
            is_verified=False,
        )
        session.add(hotel_user)
        session.flush()
        session.add(
            ProviderProfile(
                user_id=hotel_user.id,
                business_name="Seed Lake Lodge",
                category="hotel",
                phone="+251900000001",
                address="Gorgora",
                details={"starRating": "4", "amenities": ["wifi"]},
                status="PENDING",
                registered_at=datetime.utcnow(),
            )
        )
        session.add(
            Notification(
                user_id=hotel_user.id,
                title="Registration received",
                body="Your provider application is under review.",
                read=False,
            )
        )
        session.add(
            PortalBooking(
                provider_id=hotel_user.id,
                service_type="room",
                service_name="Deluxe Suite",
                customer_name="Abebe Kebede",
                customer_email="abebe@example.com",
                start_date="2026-09-10",
                end_date="2026-09-12",
                dates="2026-09-10 – 2026-09-12",
                price=12000,
                booking_status="PENDING",
                payment_status="UNPAID",
            )
        )
        session.add(
            PortalReview(
                provider_id=hotel_user.id,
                author_name="Sara",
                rating=5,
                comment="Great stay by the lake.",
                status="VISIBLE",
            )
        )
        session.add(
            ModerationItem(
                provider_id=hotel_user.id,
                content_type="DESCRIPTION",
                title="Seed Lake Lodge description",
                description="Pending content review for seed hotel.",
                status="PENDING_REVIEW",
                provider_name="Seed Lake Lodge",
                category="hotel",
            )
        )
        session.flush()
        session.add(
            PortalPayment(
                provider_id=hotel_user.id,
                booking_id=None,
                amount=5000,
                currency="ETB",
                status="COMPLETED",
                method="mobile",
                reference="seed-pay-1",
            )
        )

    if (
        session.query(PlatformSetting)
        .filter(PlatformSetting.key == "platform_name")
        .first()
        is None
    ):
        session.add(PlatformSetting(key="platform_name", value={"text": "Pagume Trip"}))
        session.add(
            PlatformSetting(key="support_email", value={"text": "support@pagume.et"})
        )
        session.add(
            PlatformSetting(key="marketplace_enabled", value={"enabled": True})
        )

    if session.query(AgentRunLog).count() == 0:
        session.add(
            AgentRunLog(
                agent="supervisor",
                task="Seed sample run",
                input_params={"destination": "Gorgora"},
                tools_called=["destination_lookup"],
                tool_results=[{"tool": "destination_lookup", "result": "ok"}],
                decisions=["Use verified inventory"],
                duration_ms=1200,
                token_usage={"total": 100},
                status="completed",
            )
        )
    session.flush()
