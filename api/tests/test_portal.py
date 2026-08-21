"""Portal auth, inventory CRUD, marketplace filters, driver verify."""

from fastapi.testclient import TestClient

from pagume_api.config import get_settings
from pagume_api.db import Base, get_engine, reset_engine
from pagume_api.main import create_app
from pagume_api.portal.core.config import get_portal_settings
from pagume_api.portal.core.security import get_password_hash
from pagume_api.portal.db.base_class import Base as PortalBase
from pagume_api.portal.db.models.user import User, UserRole
from pagume_api.portal.db.session import get_async_engine, reset_async_engine
import pytest


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "portal.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SEED_ON_STARTUP", "false")
    get_settings.cache_clear()
    get_portal_settings.cache_clear()
    reset_engine()
    reset_async_engine()

    Base.metadata.create_all(bind=get_engine())
    PortalBase.metadata.create_all(bind=get_engine())
    get_async_engine()

    app = create_app()
    with TestClient(app) as http:
        yield http

    reset_async_engine()
    reset_engine()
    get_settings.cache_clear()
    get_portal_settings.cache_clear()


def _register(client, email, role, password="password123"):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": email.split("@")[0],
            "role": role,
        },
    )
    assert res.status_code == 200, res.text
    return res.json()


def _login(client, email, password="password123"):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_register_blocks_admin(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "evil@pagume.et",
            "password": "password123",
            "full_name": "Evil",
            "role": "ADMIN",
        },
    )
    assert res.status_code == 400


def test_hotel_room_crud_and_me(client):
    _register(client, "hotel@test.et", "HOTEL_PROVIDER")
    token = _login(client, "hotel@test.et")
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.json()["role"] == "HOTEL_PROVIDER"

    hotel = client.post(
        "/api/v1/providers/hotels",
        headers=headers,
        json={
            "name": "Lake Lodge",
            "description": "Nice",
            "address": "Gorgora",
            "check_in_time": "14:00",
            "check_out_time": "11:00",
            "cancellation_policy": "Free 24h",
            "amenities": ["wifi"],
            "images": [],
            "policies": {},
        },
    )
    assert hotel.status_code == 200, hotel.text
    hotel_id = hotel.json()["id"]

    room = client.post(
        f"/api/v1/providers/hotels/{hotel_id}/rooms",
        headers=headers,
        json={
            "room_type": "Family",
            "description": "Big",
            "capacity": 4,
            "beds": 2,
            "amenities": ["ac"],
            "images": [],
            "price_per_night": 2500,
            "is_available": True,
            "availability_dates": ["2026-09-10"],
        },
    )
    assert room.status_code == 200, room.text

    public = client.get("/api/v1/public/hotels")
    assert public.status_code == 200
    assert public.json() == []


def test_tour_vehicle_driver_and_public_after_verify(client):
    from sqlalchemy.orm import Session

    engine = get_engine()
    with Session(engine) as db:
        db.add(
            User(
                email="admin@test.et",
                hashed_password=get_password_hash("password123"),
                full_name="Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
        )
        db.commit()

    _register(client, "agency@test.et", "TOUR_AGENCY")
    agency_token = _login(client, "agency@test.et")
    agency_headers = {"Authorization": f"Bearer {agency_token}"}

    tour = client.post(
        "/api/v1/providers/tours",
        headers=agency_headers,
        json={
            "name": "Boat Trip",
            "destination": "Gorgora",
            "package_type": "day_trip",
            "duration_days": 1,
            "price": 6000,
            "min_participants": 2,
            "max_participants": 12,
            "included_services": ["boat"],
            "excluded_services": [],
            "accommodation": "None",
            "transportation": "Boat",
            "activities": ["islands"],
            "guide": "Local",
            "images": [],
            "availability_dates": ["2026-09-10"],
            "cancellation_policy": "Flexible",
        },
    )
    assert tour.status_code == 200, tour.text

    _register(client, "cars@test.et", "CAR_RENTAL")
    car_token = _login(client, "cars@test.et")
    car = client.post(
        "/api/v1/providers/vehicles",
        headers={"Authorization": f"Bearer {car_token}"},
        json={
            "make": "Toyota",
            "model": "Land Cruiser",
            "year": 2019,
            "seats": 7,
            "transmission": "Manual",
            "fuel_type": "diesel",
            "is_4wd": True,
            "category": "suv",
            "daily_price": 5000,
            "pickup_locations": ["Gorgora"],
            "dropoff_locations": ["Gorgora"],
            "availability_dates": ["2026-09-10"],
            "images": [],
        },
    )
    assert car.status_code == 200, car.text

    _register(client, "driver@test.et", "DRIVER")
    driver_token = _login(client, "driver@test.et")
    profile = client.put(
        "/api/v1/providers/driver-profile",
        headers={"Authorization": f"Bearer {driver_token}"},
        json={
            "name": "Dawit",
            "license_number": "DL-1",
            "languages": ["Amharic", "English"],
            "location": "Bahir Dar",
            "availability_ranges": [{"startDate": "2026-09-01", "endDate": "2026-09-30"}],
        },
    )
    assert profile.status_code == 200, profile.text
    driver_user_id = profile.json()["user_id"]

    admin_token = _login(client, "admin@test.et")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    me_agency = client.get("/api/v1/auth/me", headers=agency_headers)
    me_cars = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {car_token}"}
    )
    client.put(
        f"/api/v1/admin/users/{me_agency.json()['id']}/verify",
        headers=admin_headers,
        params={"is_verified": True},
    )
    client.put(
        f"/api/v1/admin/users/{me_cars.json()['id']}/verify",
        headers=admin_headers,
        params={"is_verified": True},
    )
    verified = client.put(
        f"/api/v1/admin/drivers/{driver_user_id}/verify",
        headers=admin_headers,
        params={"verification_status": "VERIFIED"},
    )
    assert verified.status_code == 200

    tours = client.get("/api/v1/public/tours", params={"date": "2026-09-10"})
    assert any(t["name"] == "Boat Trip" for t in tours.json())

    vehicles = client.get(
        "/api/v1/public/vehicles", params={"category": "suv", "min_price": 1000}
    )
    assert len(vehicles.json()) >= 1

    drivers = client.get("/api/v1/public/drivers", params={"location": "Bahir"})
    assert any(d["name"] == "Dawit" for d in drivers.json())


def test_register_creates_provider_profile(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "lodge@test.et",
            "password": "password123",
            "full_name": "Lake Lodge",
            "role": "HOTEL_PROVIDER",
            "business_name": "Lake Lodge",
            "category": "hotel",
            "phone": "+251911",
            "address": "Gorgora",
            "details": {"starRating": "3"},
            "documents": [
                {"doc_type": "businessLicense", "file_name": "lic.pdf", "file_size": 100}
            ],
        },
    )
    assert res.status_code == 200, res.text
    token = _login(client, "lodge@test.et")
    onboarding = client.get(
        "/api/v1/auth/onboarding",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert onboarding.status_code == 200
    assert onboarding.json()["status"] == "PENDING"


def test_admin_destination_crud_and_provider_verify(client):
    from sqlalchemy.orm import Session

    engine = get_engine()
    with Session(engine) as db:
        db.add(
            User(
                email="admin2@test.et",
                hashed_password=get_password_hash("password123"),
                full_name="Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
        )
        db.commit()

    _register(client, "pending@test.et", "HOTEL_PROVIDER")
    admin_token = _login(client, "admin2@test.et")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    providers = client.get("/api/v1/admin/providers", headers=admin_headers)
    assert providers.status_code == 200
    assert any(p["email"] == "pending@test.et" for p in providers.json())
    user_id = next(p["user_id"] for p in providers.json() if p["email"] == "pending@test.et")

    verified = client.put(
        f"/api/v1/admin/providers/{user_id}/status",
        headers=admin_headers,
        json={"status": "VERIFIED", "reason": "ok"},
    )
    assert verified.status_code == 200
    assert verified.json()["status"] == "VERIFIED"

    created = client.post(
        "/api/v1/admin/destinations",
        headers=admin_headers,
        json={
            "name": "Test Dest",
            "description": "A place",
            "region": "Amhara",
            "zone": "North",
            "woreda": "Woreda1",
            "historical_info": "Old",
            "accessibility": "Road",
            "seasonal_info": "Dry",
            "category": "nature",
            "images": [],
        },
    )
    assert created.status_code == 200, created.text
    dest_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/admin/destinations/{dest_id}",
        headers=admin_headers,
        json={"woreda": "Woreda2"},
    )
    assert updated.status_code == 200
    assert updated.json()["woreda"] == "Woreda2"

    deleted = client.delete(
        f"/api/v1/admin/destinations/{dest_id}",
        headers=admin_headers,
    )
    assert deleted.status_code == 200


def test_booking_confirm_creates_payment(client):
    _register(client, "booker@test.et", "HOTEL_PROVIDER")
    token = _login(client, "booker@test.et")
    headers = {"Authorization": f"Bearer {token}"}

    booking = client.post(
        "/api/v1/providers/bookings",
        headers=headers,
        json={
            "service_type": "room",
            "service_name": "Suite",
            "customer_name": "Guest",
            "dates": "2026-10-01",
            "price": 3000,
        },
    )
    assert booking.status_code == 200, booking.text
    bid = booking.json()["id"]

    confirmed = client.put(
        f"/api/v1/providers/bookings/{bid}/confirm",
        headers=headers,
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["booking_status"] == "CONFIRMED"

    payments = client.get("/api/v1/providers/payments", headers=headers)
    assert payments.status_code == 200
    assert len(payments.json()) >= 1

    stats = client.get("/api/v1/providers/dashboard/stats", headers=headers)
    assert stats.status_code == 200
    assert stats.json()["bookings_confirmed"] >= 1
