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
    _seed_portal_catalog_hotels(session)


# Portal hotel providers (login like Blue Nile). Password for all: password123
_PORTAL_CATALOG_HOTELS = [
    {
        "email": "tana.shore@seed.et",
        "full_name": "Tana Shore Inn",
        "category": "hotel",
        "quality": "standard",
        "hotel": {
            "name": "Tana Shore Inn",
            "description": "Simple budget hotel near the Bahir Dar waterfront for short stays.",
            "address": "Waterfront Road, Bahir Dar, Amhara, Ethiopia",
            "latitude": 11.598,
            "longitude": 37.385,
            "contact_details": "+251911100001 · stay@tanashore.et",
            "amenities": ["Free WiFi", "Parking"],
            "check_in_time": "14:00",
            "check_out_time": "11:00",
            "cancellation_policy": "Free cancellation up to 24 hours before check-in.",
        },
        "rooms": [
            {
                "room_type": "double",
                "description": "Compact double with city view.",
                "capacity": 2,
                "beds": 1,
                "amenities": ["Ensuite"],
                "price_per_night": 1800,
            }
        ],
    },
    {
        "email": "skylon.addis@seed.et",
        "full_name": "Skylon Addis Suites",
        "category": "hotel",
        "quality": "luxury",
        "hotel": {
            "name": "Skylon Addis Suites",
            "description": "Upscale city hotel with spa, fine dining, and executive floors.",
            "address": "Bole Atlas, Addis Ababa, Ethiopia",
            "latitude": 9.018,
            "longitude": 38.752,
            "contact_details": "+251911100002 · concierge@skylonaddis.et",
            "amenities": ["Spa", "Restaurant", "Free WiFi", "Gym", "Concierge"],
            "check_in_time": "15:00",
            "check_out_time": "12:00",
            "cancellation_policy": "Free cancellation up to 72 hours before check-in.",
        },
        "rooms": [
            {
                "room_type": "suite",
                "description": "Executive suite with lounge access.",
                "capacity": 3,
                "beds": 1,
                "amenities": ["Ensuite", "Minibar", "City View"],
                "price_per_night": 12000,
            }
        ],
    },
    {
        "email": "palm.bay@seed.et",
        "full_name": "Palm Bay Resort",
        "category": "resort",
        "quality": "comfortable",
        "hotel": {
            "name": "Palm Bay Resort",
            "description": "Family lakeside resort with pools and boat pier access.",
            "address": "Lake Tana Shore, Bahir Dar, Amhara, Ethiopia",
            "latitude": 11.605,
            "longitude": 37.402,
            "contact_details": "+251911100003 · hello@palmbay.et",
            "amenities": ["Pool", "Lake View", "Restaurant", "Free WiFi", "Kids Club"],
            "check_in_time": "14:00",
            "check_out_time": "11:00",
            "cancellation_policy": "Free cancellation up to 48 hours before check-in.",
        },
        "rooms": [
            {
                "room_type": "family",
                "description": "Garden villa for a family of four.",
                "capacity": 4,
                "beds": 2,
                "amenities": ["Ensuite", "Lake View", "Terrace"],
                "price_per_night": 6200,
            }
        ],
    },
    {
        "email": "royal.tana@seed.et",
        "full_name": "Royal Tana Resort",
        "category": "resort",
        "quality": "luxury",
        "hotel": {
            "name": "Royal Tana Resort",
            "description": "Luxury waterfront resort with private beach and spa pavilions.",
            "address": "Northern Shore, Gorgora, Amhara, Ethiopia",
            "latitude": 12.241,
            "longitude": 37.31,
            "contact_details": "+251911100004 · vip@royaltana.et",
            "amenities": ["Spa", "Private Beach", "Restaurant", "Free WiFi", "Boat Transfers"],
            "check_in_time": "15:00",
            "check_out_time": "12:00",
            "cancellation_policy": "Free cancellation up to 7 days before check-in.",
        },
        "rooms": [
            {
                "room_type": "villa",
                "description": "Private lake villa with plunge pool.",
                "capacity": 4,
                "beds": 2,
                "amenities": ["Ensuite", "Lake View", "Butler"],
                "price_per_night": 18000,
            }
        ],
    },
    {
        "email": "escarpment@seed.et",
        "full_name": "Escarpment Camp Lodge",
        "category": "lodge",
        "quality": "standard",
        "hotel": {
            "name": "Escarpment Camp Lodge",
            "description": "Basic trekker lodge with shared dining and mountain views.",
            "address": "Near Debark, Simien Mountains, Amhara, Ethiopia",
            "latitude": 13.19,
            "longitude": 38.05,
            "contact_details": "+251911100005 · camp@escarpment.et",
            "amenities": ["Restaurant", "Fireplace"],
            "check_in_time": "14:00",
            "check_out_time": "10:00",
            "cancellation_policy": "Free cancellation up to 24 hours before check-in.",
        },
        "rooms": [
            {
                "room_type": "twin",
                "description": "Simple twin cabin for two trekkers.",
                "capacity": 2,
                "beds": 2,
                "amenities": ["Shared Bath"],
                "price_per_night": 2200,
            }
        ],
    },
    {
        "email": "omo.luxury@seed.et",
        "full_name": "Omo River Luxury Lodge",
        "category": "lodge",
        "quality": "luxury",
        "hotel": {
            "name": "Omo River Luxury Lodge",
            "description": "High-end eco lodge with guided community visits and gourmet dining.",
            "address": "Near Jinka, Omo Valley, South Ethiopia",
            "latitude": 5.79,
            "longitude": 36.55,
            "contact_details": "+251911100006 · stay@omoriver.et",
            "amenities": ["Restaurant", "Free WiFi", "Garden", "Guided Tours", "Spa"],
            "check_in_time": "14:00",
            "check_out_time": "11:00",
            "cancellation_policy": "Free cancellation up to 5 days before check-in.",
        },
        "rooms": [
            {
                "room_type": "suite",
                "description": "Canvas suite with outdoor shower.",
                "capacity": 2,
                "beds": 1,
                "amenities": ["Ensuite", "Deck", "Minibar"],
                "price_per_night": 14000,
            }
        ],
    },
    {
        "email": "pilgrim.lalibela@seed.et",
        "full_name": "Pilgrim Rest Guesthouse",
        "category": "guesthouse",
        "quality": "standard",
        "hotel": {
            "name": "Pilgrim Rest Guesthouse",
            "description": "Affordable guesthouse walking distance from the rock churches.",
            "address": "Church Road, Lalibela, Amhara, Ethiopia",
            "latitude": 12.028,
            "longitude": 39.045,
            "contact_details": "+251911100007 · rest@pilgrimlalibela.et",
            "amenities": ["Free WiFi", "Breakfast"],
            "check_in_time": "13:00",
            "check_out_time": "10:00",
            "cancellation_policy": "Free cancellation up to 24 hours before check-in.",
        },
        "rooms": [
            {
                "room_type": "double",
                "description": "Homely double with shared courtyard.",
                "capacity": 2,
                "beds": 1,
                "amenities": ["Shared Bath"],
                "price_per_night": 1200,
            }
        ],
    },
    {
        "email": "heritage.axum@seed.et",
        "full_name": "Heritage Courtyard Guesthouse",
        "category": "guesthouse",
        "quality": "comfortable",
        "hotel": {
            "name": "Heritage Courtyard Guesthouse",
            "description": "Comfortable boutique guesthouse near the stelae park with garden dining.",
            "address": "Stelae Park Road, Axum, Tigray, Ethiopia",
            "latitude": 14.13,
            "longitude": 38.72,
            "contact_details": "+251911100008 · stay@heritageaxum.et",
            "amenities": ["Free WiFi", "Breakfast", "Garden", "Restaurant"],
            "check_in_time": "14:00",
            "check_out_time": "11:00",
            "cancellation_policy": "Free cancellation up to 48 hours before check-in.",
        },
        "rooms": [
            {
                "room_type": "deluxe",
                "description": "Deluxe room overlooking the courtyard garden.",
                "capacity": 2,
                "beds": 1,
                "amenities": ["Ensuite", "Garden View"],
                "price_per_night": 3800,
            }
        ],
    },
]


def _seed_portal_catalog_hotels(session: Session) -> None:
    """Verified hotel providers + properties for portal login demos."""
    from datetime import datetime

    from pagume_api.portal.core.security import get_password_hash
    from pagume_api.portal.db.models.ops import ProviderProfile
    from pagume_api.portal.db.models.provider import Hotel, Room
    from pagume_api.portal.db.models.user import User, UserRole

    password_hash = get_password_hash("password123")

    for entry in _PORTAL_CATALOG_HOTELS:
        user = session.query(User).filter(User.email == entry["email"]).first()
        if user is None:
            user = User(
                email=entry["email"],
                hashed_password=password_hash,
                full_name=entry["full_name"],
                role=UserRole.HOTEL_PROVIDER,
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            session.flush()
            session.add(
                ProviderProfile(
                    user_id=user.id,
                    business_name=entry["hotel"]["name"],
                    category="hotel",
                    phone=entry["hotel"]["contact_details"].split("·")[0].strip(),
                    address=entry["hotel"]["address"],
                    details={
                        "propertyType": entry["category"],
                        "starRating": (
                            "5"
                            if entry["quality"] == "luxury"
                            else "4"
                            if entry["quality"] == "comfortable"
                            else "3"
                        ),
                        "quality": entry["quality"],
                    },
                    status="VERIFIED",
                    registered_at=datetime.utcnow(),
                )
            )
            session.flush()

        existing = (
            session.query(Hotel)
            .filter(Hotel.provider_id == user.id, Hotel.name == entry["hotel"]["name"])
            .first()
        )
        if existing is not None:
            continue

        hotel = Hotel(
            provider_id=user.id,
            name=entry["hotel"]["name"],
            description=entry["hotel"]["description"],
            address=entry["hotel"]["address"],
            latitude=entry["hotel"]["latitude"],
            longitude=entry["hotel"]["longitude"],
            contact_details=entry["hotel"]["contact_details"],
            images=[],
            amenities=entry["hotel"]["amenities"],
            policies={},
            check_in_time=entry["hotel"]["check_in_time"],
            check_out_time=entry["hotel"]["check_out_time"],
            cancellation_policy=entry["hotel"]["cancellation_policy"],
        )
        session.add(hotel)
        session.flush()
        for room in entry["rooms"]:
            session.add(
                Room(
                    hotel_id=hotel.id,
                    room_type=room["room_type"],
                    description=room["description"],
                    capacity=room["capacity"],
                    beds=room["beds"],
                    amenities=room["amenities"],
                    images=[],
                    price_per_night=room["price_per_night"],
                    is_available=True,
                    availability_dates=[],
                )
            )
    session.flush()
