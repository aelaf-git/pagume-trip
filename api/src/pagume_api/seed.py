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
    _enrich_portal_destinations(session)
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
    _seed_portal_catalog_agencies(session)
    _seed_portal_catalog_car_rentals(session)
    _enrich_portal_destinations(session)


# Rich portal destination details (fill gaps on existing rows; keyed by name).
_PORTAL_DESTINATION_ENRICHMENT = {
    "Gorgora": {
        "description": (
            "Historic town on the northern shore of Lake Tana, known for lakeside monasteries, "
            "birdlife, and boat trips toward the lake islands."
        ),
        "historical_info": (
            "Gorgora was an early Portuguese and Jesuit foothold on Lake Tana in the 16th–17th "
            "centuries. Ruins and lakeside churches still mark that period alongside traditional Amhara villages."
        ),
        "accessibility": (
            "Reach Bahir Dar by flight or road, then continue north by boat or road along the lake shore. "
            "Local boats and guesthouse transfers are common for day trips."
        ),
        "seasonal_info": (
            "Dry months (October–May) are best for boat travel and birdwatching. June–September rains "
            "can roughen lake conditions and muddy access tracks."
        ),
        "images": [
            "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80",
        ],
    },
    "Lalibela": {
        "description": (
            "UNESCO-listed rock-hewn churches carved from living rock and a major Ethiopian Orthodox "
            "pilgrimage destination in the highlands of North Wollo."
        ),
        "historical_info": (
            "King Lalibela of the Zagwe dynasty ordered the churches in the late 12th–early 13th century "
            "as a ‘New Jerusalem’. The complex remains an active place of worship."
        ),
        "accessibility": (
            "Daily flights to Lalibela Airport from Addis Ababa, then a short road transfer to town. "
            "Guides and entrance tickets are arranged at the church office."
        ),
        "seasonal_info": (
            "Year-round destination; Timkat (January) is especially busy. Highland nights are cool—pack layers. "
            "Rains peak roughly June–September."
        ),
        "images": [
            "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1400&q=80",
        ],
    },
    "Gondar": {
        "description": (
            "Former imperial capital known for the Fasil Ghebbi castle compound, Debre Berhan Selassie church, "
            "and as a gateway to the Simien Mountains."
        ),
        "historical_info": (
            "Gondar served as Ethiopia’s capital from the 17th to mid-19th century. Fasilides and later emperors "
            "built the royal enclosure—Africa’s most famous castle complex of its era."
        ),
        "accessibility": (
            "Flights and buses connect Gondar with Addis Ababa and Bahir Dar. The castles are in the city center; "
            "Simien park access is via Debark to the north."
        ),
        "seasonal_info": (
            "Pleasant highland climate most of the year. Timkat celebrations draw large crowds in January. "
            "Roads to Simien are more reliable in the dry season."
        ),
        "images": [
            "https://images.unsplash.com/photo-1621415813707-4693019f2449?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1400&q=80",
        ],
    },
    "Bahir Dar": {
        "description": (
            "Lakeside city on Lake Tana—gateway to the Blue Nile Falls (Tis Abay) and island monasteries "
            "scattered across Ethiopia’s largest lake."
        ),
        "historical_info": (
            "Bahir Dar grew as a trade and administrative hub on Lake Tana. Nearby island monasteries hold "
            "centuries of Orthodox manuscripts, icons, and mural traditions."
        ),
        "accessibility": (
            "Frequent flights to Bahir Dar Airport and highway links from Addis Ababa. Boats leave the waterfront "
            "for lake islands; the falls are a short drive or boat-and-road combination."
        ),
        "seasonal_info": (
            "Best lake and falls visits in the dry season when paths are firmer. After heavy rains the falls "
            "are fuller but trails can be slippery."
        ),
        "images": [
            "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=80",
        ],
    },
    "Axum": {
        "description": (
            "Ancient Aksumite capital with towering stelae fields, royal tombs, and churches tied to Ethiopia’s "
            "early Christian history."
        ),
        "historical_info": (
            "Aksum was the seat of a powerful trading empire linking the Red Sea and African highlands. "
            "The Great Stelae Park and St Mary of Zion complex are among Ethiopia’s most important archaeological sites."
        ),
        "accessibility": (
            "Flights to Axum Airport from Addis Ababa or Mekelle, plus road access via Adwa. Sites are close to "
            "town and usually visited with a licensed guide."
        ),
        "seasonal_info": (
            "Dry and warm most months; mornings are best for outdoor stelae visits. Major festivals increase "
            "pilgrim traffic around religious holidays."
        ),
        "images": [
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1400&q=80",
        ],
    },
    "Harar": {
        "description": (
            "Walled historic city in eastern Ethiopia—Jegol alleys, coffee culture, markets, and the famous "
            "evening hyena feeding tradition."
        ),
        "historical_info": (
            "Harar was a center of Islamic scholarship and trade for centuries. The Jegol walls enclose hundreds "
            "of mosques and shrines; UNESCO lists the old city as a World Heritage site."
        ),
        "accessibility": (
            "Flights or road via Dire Dawa, then a short transfer up to Harar. Old town is best explored on foot "
            "with a local guide."
        ),
        "seasonal_info": (
            "Warm climate year-round. Evenings are lively for markets and hyena feeding; midday heat can be strong—"
            "plan indoor museum visits then."
        ),
        "images": [
            "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1489392191049-fc10c377a0c5?auto=format&fit=crop&w=1400&q=80",
        ],
    },
    "Simien Mountains": {
        "description": (
            "UNESCO national park of dramatic escarpments, alpine meadows, gelada baboons, and highland trekking "
            "routes above Debark."
        ),
        "historical_info": (
            "Protected as a national park and World Heritage site for its unique Afro-alpine ecology and endemic "
            "wildlife, including the Walia ibex and Ethiopian wolf in surrounding ranges."
        ),
        "accessibility": (
            "Travel via Gondar to Debark for park permits, scouts, and guides. Day hikes and multi-day treks "
            "depart from park gates with mandatory accompaniment rules."
        ),
        "seasonal_info": (
            "Trekking is most comfortable October–March. June–September rains make trails muddy and views hazy; "
            "nights are cold at altitude year-round."
        ),
        "images": [
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1501785888041-af3ba6fe3f47?auto=format&fit=crop&w=1400&q=80",
        ],
    },
    "Addis Ababa": {
        "description": (
            "Ethiopia’s capital and main gateway—museums, markets, coffee houses, and Bole International Airport "
            "transfers for onward travel."
        ),
        "historical_info": (
            "Founded in the late 19th century by Menelik II, Addis Ababa hosts the African Union headquarters "
            "and major national museums covering Ethiopia’s imperial and archaeological heritage."
        ),
        "accessibility": (
            "Bole International Airport is the primary entry point. Ride-hailing, taxis, and hotel shuttles cover "
            "the city; domestic flights connect to tourist hubs nationwide."
        ),
        "seasonal_info": (
            "Mild highland climate with a main rainy season roughly June–September. Dry months are ideal for "
            "city walks and day trips to nearby Entoto or Debre Libanos."
        ),
        "images": [
            "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=80",
        ],
    },
    "Omo Valley": {
        "description": (
            "Southern Ethiopia cultural region around Jinka and Turmi—markets, river landscapes, and community "
            "visits across the lower Omo."
        ),
        "historical_info": (
            "The Lower Omo is home to diverse agro-pastoral communities with distinct languages and ceremonies. "
            "Responsible tourism emphasizes guided visits arranged through local hosts."
        ),
        "accessibility": (
            "Fly or drive to Jinka (or Arba Minch as a staging point), then use 4x4 transfers to Turmi and "
            "surrounding villages. Roads can be rough—allow buffer days."
        ),
        "seasonal_info": (
            "Dry season travel is smoother for dirt roads. Market days vary by town; confirm schedules locally. "
            "Rains can isolate some villages temporarily."
        ),
        "images": [
            "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80",
        ],
    },
}


def _enrich_portal_destinations(session: Session) -> None:
    """Fill missing description, history, access, season, and images on portal destinations."""
    from pagume_api.portal.db.models.destination import Destination as PortalDestination

    rows = session.query(PortalDestination).all()
    for dest in rows:
        enrich = _PORTAL_DESTINATION_ENRICHMENT.get(dest.name)
        if not enrich:
            # try case-insensitive match
            enrich = next(
                (
                    v
                    for k, v in _PORTAL_DESTINATION_ENRICHMENT.items()
                    if k.lower() == (dest.name or "").lower()
                ),
                None,
            )
        if not enrich:
            continue

        if not (dest.description or "").strip() and enrich.get("description"):
            dest.description = enrich["description"]
        elif enrich.get("description") and len((dest.description or "").strip()) < 80:
            dest.description = enrich["description"]

        if not (dest.historical_info or "").strip() and enrich.get("historical_info"):
            dest.historical_info = enrich["historical_info"]
        if not (dest.accessibility or "").strip() and enrich.get("accessibility"):
            dest.accessibility = enrich["accessibility"]
        if not (dest.seasonal_info or "").strip() and enrich.get("seasonal_info"):
            dest.seasonal_info = enrich["seasonal_info"]

        existing_images = list(dest.images or [])
        if not existing_images and enrich.get("images"):
            dest.images = list(enrich["images"])

        if dest.status is None:
            dest.status = "ACTIVE"
        if not dest.verification_status:
            dest.verification_status = "VERIFIED"

    session.flush()


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


_PORTAL_CATALOG_AGENCIES = [
    {
        "email": "highland.trails@seed.et",
        "full_name": "Highland Trails Tours",
        "business_name": "Highland Trails",
        "phone": "+251 91 200 1100",
        "address": "Bole Road, Addis Ababa",
        "description": "Expert-led cultural and highland trekking packages across northern Ethiopia.",
        "packages": [
            {
                "name": "Lalibela Heritage Circuit",
                "description": "Three days among the rock-hewn churches with a licensed local guide.",
                "destination": "lalibela",
                "package_type": "multi_day",
                "duration_days": 3,
                "price": 18500,
                "min_participants": 2,
                "max_participants": 12,
                "included_services": ["Guide", "Entrance fees", "Hotel (2 nights)"],
                "excluded_services": ["Flights", "Travel insurance"],
                "accommodation": "3-star boutique hotel near the churches",
                "transportation": "Private 4x4 transfers",
                "activities": [
                    {"id": "act-1", "name": "Northern cluster churches"},
                    {"id": "act-2", "name": "Asheton Maryam hike"},
                ],
                "guide": "Licensed Lalibela cultural guide",
                "cancellation_policy": "Full refund up to 14 days before departure.",
            },
            {
                "name": "Simien Day Trek",
                "description": "One-day trek on the Simien escarpment with gelada viewing.",
                "destination": "gondar",
                "package_type": "day_trip",
                "duration_days": 1,
                "price": 4200,
                "min_participants": 1,
                "max_participants": 8,
                "included_services": ["Park fees", "Scout", "Packed lunch"],
                "excluded_services": ["Overnight lodging"],
                "accommodation": "",
                "transportation": "Shared shuttle from Gondar",
                "activities": [{"id": "act-1", "name": "Sankaber trail"}],
                "guide": "Park-accredited scout",
                "cancellation_policy": "Free cancellation up to 48 hours before.",
            },
        ],
    },
    {
        "email": "rift.voyages@seed.et",
        "full_name": "Rift Voyages",
        "business_name": "Rift Voyages",
        "phone": "+251 91 455 2200",
        "address": "Hawassa Lakeside Ave",
        "description": "Rift Valley nature and community tourism with small-group departures.",
        "packages": [
            {
                "name": "Omo Valley Explorer",
                "description": "Five-day cultural journey through South Omo communities.",
                "destination": "jinka",
                "package_type": "multi_day",
                "duration_days": 5,
                "price": 42000,
                "min_participants": 4,
                "max_participants": 10,
                "included_services": ["Guide", "Camping gear", "Cook", "4x4"],
                "excluded_services": ["Domestic flights", "Personal tips"],
                "accommodation": "Tented camps and community lodges",
                "transportation": "Dedicated Land Cruiser",
                "activities": [
                    {"id": "act-1", "name": "Turmi market visit"},
                    {"id": "act-2", "name": "Omo River sunset"},
                ],
                "guide": "Omo Valley specialist guide",
                "cancellation_policy": "50% refund up to 21 days before departure.",
            }
        ],
    },
    {
        "email": "axum.heritage.tours@seed.et",
        "full_name": "Axum Heritage Tours",
        "business_name": "Axum Heritage Tours",
        "phone": "+251 91 300 3300",
        "address": "Axum Town Center",
        "description": "Archaeology-focused tours of Axum, Yeha, and the northern historic route.",
        "packages": [
            {
                "name": "Axum Obelisks & Stelae",
                "description": "Full-day guided visit of Axum's UNESCO sites with a licensed historian.",
                "destination": "axum",
                "package_type": "day_trip",
                "duration_days": 1,
                "price": 3500,
                "min_participants": 1,
                "max_participants": 15,
                "included_services": ["Guide", "Entrance fees", "Bottled water"],
                "excluded_services": ["Lunch", "Tips"],
                "accommodation": "",
                "transportation": "Local transfers included",
                "activities": [
                    {"id": "act-1", "name": "Northern stelae park"},
                    {"id": "act-2", "name": "Church of St Mary of Zion"},
                ],
                "guide": "Licensed Axum historian guide",
                "cancellation_policy": "Free cancellation up to 24 hours before.",
            }
        ],
    },
    {
        "email": "danakil.expeditions@seed.et",
        "full_name": "Danakil Expeditions",
        "business_name": "Danakil Expeditions",
        "phone": "+251 91 611 4400",
        "address": "Mekelle Industrial Zone Road",
        "description": "Specialist desert logistics for Erta Ale and Dallol expeditions.",
        "packages": [
            {
                "name": "Erta Ale & Dallol Circuit",
                "description": "Four-day expedition with 4x4 support, camping, and desert scouts.",
                "destination": "danakil",
                "package_type": "multi_day",
                "duration_days": 4,
                "price": 38000,
                "min_participants": 4,
                "max_participants": 12,
                "included_services": ["4x4", "Camping", "Cook", "Scout", "Park fees"],
                "excluded_services": ["Flights to Mekelle", "Sleeping bag"],
                "accommodation": "Desert camping",
                "transportation": "Toyota Land Cruiser convoy",
                "activities": [
                    {"id": "act-1", "name": "Erta Ale crater overnight"},
                    {"id": "act-2", "name": "Dallol colorful springs"},
                ],
                "guide": "Afar desert expedition lead",
                "cancellation_policy": "Non-refundable within 10 days of departure.",
            }
        ],
    },
    {
        "email": "bale.highland@seed.et",
        "full_name": "Bale Highland Adventures",
        "business_name": "Bale Highland Adventures",
        "phone": "+251 91 722 5500",
        "address": "Goba Main Street",
        "description": "Trekking and wildlife packages in Bale Mountains National Park.",
        "packages": [
            {
                "name": "Sanetti Plateau Trek",
                "description": "Two-day highland trek with Ethiopian wolf spotting opportunities.",
                "destination": "bale",
                "package_type": "multi_day",
                "duration_days": 2,
                "price": 12000,
                "min_participants": 2,
                "max_participants": 8,
                "included_services": ["Guide", "Park fees", "Lodge (1 night)", "Pack mules"],
                "excluded_services": ["Personal gear", "Travel insurance"],
                "accommodation": "Mountain lodge near Dinsho",
                "transportation": "Transfer from Goba",
                "activities": [
                    {"id": "act-1", "name": "Sanetti Plateau walk"},
                    {"id": "act-2", "name": "Harenna Forest edge"},
                ],
                "guide": "Bale Mountains park guide",
                "cancellation_policy": "Full refund up to 7 days before departure.",
            }
        ],
    },
]


def _seed_portal_catalog_agencies(session: Session) -> None:
    """Verified tour agencies + sample packages for portal login demos."""
    from datetime import datetime

    from pagume_api.portal.core.security import get_password_hash
    from pagume_api.portal.db.models.ops import ProviderProfile
    from pagume_api.portal.db.models.provider import TourPackage
    from pagume_api.portal.db.models.user import User, UserRole

    password_hash = get_password_hash("password123")

    for entry in _PORTAL_CATALOG_AGENCIES:
        user = session.query(User).filter(User.email == entry["email"]).first()
        if user is None:
            user = User(
                email=entry["email"],
                hashed_password=password_hash,
                full_name=entry["full_name"],
                role=UserRole.TOUR_AGENCY,
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            session.flush()
            session.add(
                ProviderProfile(
                    user_id=user.id,
                    business_name=entry["business_name"],
                    category="agency",
                    phone=entry["phone"],
                    address=entry["address"],
                    details={
                        "description": entry["description"],
                        "logo": "",
                        "coverImage": "",
                    },
                    status="VERIFIED",
                    registered_at=datetime.utcnow(),
                )
            )
            session.flush()

        for pkg in entry["packages"]:
            existing = (
                session.query(TourPackage)
                .filter(TourPackage.agency_id == user.id, TourPackage.name == pkg["name"])
                .first()
            )
            if existing is not None:
                continue
            session.add(
                TourPackage(
                    agency_id=user.id,
                    name=pkg["name"],
                    description=pkg["description"],
                    destination=pkg["destination"],
                    package_type=pkg["package_type"],
                    duration_days=pkg["duration_days"],
                    price=pkg["price"],
                    min_participants=pkg["min_participants"],
                    max_participants=pkg["max_participants"],
                    included_services=pkg["included_services"],
                    excluded_services=pkg["excluded_services"],
                    accommodation=pkg["accommodation"],
                    transportation=pkg["transportation"],
                    activities=pkg["activities"],
                    guide=pkg["guide"],
                    images=[],
                    availability_dates=[],
                    cancellation_policy=pkg["cancellation_policy"],
                )
            )
    session.flush()


_PORTAL_CATALOG_CAR_RENTALS = [
    {
        "email": "nile.drive@seed.et",
        "full_name": "Nile Drive Rentals",
        "business_name": "Nile Drive",
        "phone": "+251 91 800 1000",
        "address": "Airport Road, Bahir Dar",
        "description": "Airport pickups and lake-region self-drive and chauffeur rentals.",
        "vehicles": [
            {
                "make": "Toyota",
                "model": "Corolla",
                "year": 2022,
                "seats": 5,
                "transmission": "automatic",
                "fuel_type": "petrol",
                "is_4wd": False,
                "category": "car",
                "daily_price": 2800,
                "weekly_price": 16000,
                "deposit": 5000,
                "insurance_details": "Third-party included; CDW optional.",
                "driver_available": True,
                "pickup_locations": ["Bahir Dar Airport", "City office"],
                "dropoff_locations": ["Bahir Dar Airport", "City office"],
                "rental_policies": "Minimum age 23. Valid international license required.",
            },
            {
                "make": "Toyota",
                "model": "Land Cruiser Prado",
                "year": 2021,
                "seats": 7,
                "transmission": "automatic",
                "fuel_type": "diesel",
                "is_4wd": True,
                "category": "suv",
                "daily_price": 6500,
                "weekly_price": 38000,
                "deposit": 15000,
                "insurance_details": "Comprehensive with ETB 10,000 excess.",
                "driver_available": True,
                "pickup_locations": ["Bahir Dar Airport"],
                "dropoff_locations": ["Bahir Dar Airport", "Gondar"],
                "rental_policies": "Off-road use allowed with prior notice.",
            },
        ],
    },
    {
        "email": "addis.wheels@seed.et",
        "full_name": "Addis Wheels",
        "business_name": "Addis Wheels",
        "phone": "+251 91 811 2200",
        "address": "Bole Atlas, Addis Ababa",
        "description": "City and intercity rentals with optional English-speaking drivers.",
        "vehicles": [
            {
                "make": "Hyundai",
                "model": "Tucson",
                "year": 2023,
                "seats": 5,
                "transmission": "automatic",
                "fuel_type": "petrol",
                "is_4wd": False,
                "category": "suv",
                "daily_price": 4200,
                "weekly_price": 25000,
                "deposit": 8000,
                "insurance_details": "Full cover for city use.",
                "driver_available": True,
                "pickup_locations": ["Bole Airport", "Atlas office"],
                "dropoff_locations": ["Bole Airport", "Atlas office"],
                "rental_policies": "Unlimited km within Addis; intercity surcharge applies.",
            },
            {
                "make": "Suzuki",
                "model": "Swift",
                "year": 2020,
                "seats": 4,
                "transmission": "manual",
                "fuel_type": "petrol",
                "is_4wd": False,
                "category": "car",
                "daily_price": 1800,
                "weekly_price": 10000,
                "deposit": 3000,
                "insurance_details": "Basic third-party.",
                "driver_available": False,
                "pickup_locations": ["Atlas office"],
                "dropoff_locations": ["Atlas office"],
                "rental_policies": "Self-drive only. Fuel not included.",
            },
        ],
    },
    {
        "email": "simien.motors@seed.et",
        "full_name": "Simien Motors",
        "business_name": "Simien Motors",
        "phone": "+251 91 822 3300",
        "address": "Gondar Castle Road",
        "description": "4x4 specialist for Simien Mountains and northern historic route.",
        "vehicles": [
            {
                "make": "Toyota",
                "model": "Hilux",
                "year": 2019,
                "seats": 5,
                "transmission": "manual",
                "fuel_type": "diesel",
                "is_4wd": True,
                "category": "pickup",
                "daily_price": 5500,
                "weekly_price": 32000,
                "deposit": 12000,
                "insurance_details": "Park-route cover with scout coordination.",
                "driver_available": True,
                "pickup_locations": ["Gondar Airport", "City office"],
                "dropoff_locations": ["Gondar Airport", "Debark"],
                "rental_policies": "Driver-guide recommended for mountain roads.",
            }
        ],
    },
]


def _seed_portal_catalog_car_rentals(session: Session) -> None:
    """Verified car rental companies + sample fleet for portal login demos."""
    from datetime import datetime

    from pagume_api.portal.core.security import get_password_hash
    from pagume_api.portal.db.models.ops import ProviderProfile
    from pagume_api.portal.db.models.provider import Vehicle
    from pagume_api.portal.db.models.user import User, UserRole

    password_hash = get_password_hash("password123")

    for entry in _PORTAL_CATALOG_CAR_RENTALS:
        user = session.query(User).filter(User.email == entry["email"]).first()
        if user is None:
            user = User(
                email=entry["email"],
                hashed_password=password_hash,
                full_name=entry["full_name"],
                role=UserRole.CAR_RENTAL,
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            session.flush()
            session.add(
                ProviderProfile(
                    user_id=user.id,
                    business_name=entry["business_name"],
                    category="transport",
                    phone=entry["phone"],
                    address=entry["address"],
                    details={
                        "description": entry["description"],
                        "logo": "",
                        "coverImage": "",
                    },
                    status="VERIFIED",
                    registered_at=datetime.utcnow(),
                )
            )
            session.flush()

        for veh in entry["vehicles"]:
            existing = (
                session.query(Vehicle)
                .filter(
                    Vehicle.rental_company_id == user.id,
                    Vehicle.make == veh["make"],
                    Vehicle.model == veh["model"],
                    Vehicle.year == veh["year"],
                )
                .first()
            )
            if existing is not None:
                continue
            session.add(
                Vehicle(
                    rental_company_id=user.id,
                    make=veh["make"],
                    model=veh["model"],
                    year=veh["year"],
                    seats=veh["seats"],
                    transmission=veh["transmission"],
                    fuel_type=veh["fuel_type"],
                    is_4wd=veh["is_4wd"],
                    category=veh["category"],
                    images=[],
                    daily_price=veh["daily_price"],
                    weekly_price=veh["weekly_price"],
                    deposit=veh["deposit"],
                    insurance_details=veh["insurance_details"],
                    driver_available=veh["driver_available"],
                    pickup_locations=veh["pickup_locations"],
                    dropoff_locations=veh["dropoff_locations"],
                    rental_policies=veh["rental_policies"],
                    availability_dates=[],
                )
            )
    session.flush()
