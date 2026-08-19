def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_search_gorgora(client):
    response = client.get("/v1/destinations", params={"q": "Gorgora"})
    assert response.status_code == 200
    results = response.json()["results"]
    assert results[0]["id"] == "dest_gorgora"


def test_gondar_ranks_ahead_of_north_gondar_zone(client):
    results = client.get("/v1/destinations", params={"q": "Gondar"}).json()["results"]
    assert results[0]["id"] == "dest_gondar"


def test_unknown_destination_empty(client):
    response = client.get("/v1/destinations", params={"q": "Atlantis"})
    assert response.json()["results"] == []


def test_create_destination(client):
    payload = {
        "id": "dest_test_city",
        "name": "Test City",
        "description": "Created by API test",
        "region": "Amhara",
        "zone": "Test",
        "latitude": 11.0,
        "longitude": 38.0,
        "category": "historical",
        "verification_status": "VERIFIED",
    }
    created = client.post("/v1/destinations", json=payload)
    assert created.status_code == 201
    fetched = client.get("/v1/destinations/dest_test_city")
    assert fetched.json()["name"] == "Test City"


def test_hotels_and_availability(client):
    hotels = client.get(
        "/v1/hotels",
        params={"destination_id": "dest_gorgora", "guests": 6},
    ).json()["results"]
    assert hotels
    hotel_id = "hotel_gorgora_resort_a"
    room_id = hotels[0]["rooms"][0]["id"]
    available = client.get(
        f"/v1/hotels/{hotel_id}/rooms/{room_id}/availability",
        params={"check_in": "2026-09-10", "check_out": "2026-09-14"},
    ).json()
    assert available["available"] is True


def test_transport_tours(client):
    vehicles = client.get(
        "/v1/transport", params={"destination_id": "dest_gorgora", "seats": 6}
    ).json()["results"]
    assert any(v["id"] == "vehicle_gorgora_a" for v in vehicles)
    tours = client.get(
        "/v1/tours", params={"destination_id": "dest_gorgora", "q": "boat", "guests": 6}
    ).json()["results"]
    assert any(t["id"] == "tour_gorgora_boat_a" for t in tours)


def test_trip_and_idempotent_booking(client):
    trip = client.post(
        "/v1/trips",
        json={
            "id": "",
            "destination_id": "dest_gorgora",
            "total_etb": 44000,
            "itinerary": [
                {
                    "day": 1,
                    "title": "Check-in",
                    "description": "Arrive",
                    "entity_type": "hotel",
                    "entity_id": "hotel_gorgora_resort_a",
                }
            ],
        },
    )
    assert trip.status_code == 201
    trip_id = trip.json()["id"]
    updated = client.put(
        f"/v1/trips/{trip_id}/itinerary",
        json=[
            {"day": 1, "title": "Travel", "description": ""},
            {"day": 2, "title": "Boat", "description": "", "entity_id": "tour_gorgora_boat_a"},
        ],
    )
    assert len(updated.json()["itinerary"]) == 2

    headers = {"Idempotency-Key": "prep-1"}
    prepared = client.post(
        "/v1/bookings/prepare",
        json={
            "user_id": "user_1",
            "items": [
                {
                    "service_type": "hotel",
                    "entity_id": "hotel_gorgora_resort_a",
                    "name": "Gorgora Lakeside Resort",
                    "price_etb": 18000,
                    "room_id": "room_resort_a_family",
                    "check_in": "2026-09-10",
                    "check_out": "2026-09-14",
                }
            ],
        },
        headers=headers,
    )
    assert prepared.status_code == 201
    again = client.post(
        "/v1/bookings/prepare",
        json={
            "user_id": "user_1",
            "items": [
                {
                    "service_type": "hotel",
                    "entity_id": "hotel_gorgora_resort_a",
                    "name": "Gorgora Lakeside Resort",
                    "price_etb": 18000,
                    "room_id": "room_resort_a_family",
                    "check_in": "2026-09-10",
                    "check_out": "2026-09-14",
                }
            ],
        },
        headers=headers,
    )
    # second prepare with same key returns same booking
    assert again.json()["id"] == prepared.json()["id"]

    booking_id = prepared.json()["id"]
    confirm_headers = {"Idempotency-Key": "confirm-1"}
    first = client.post(f"/v1/bookings/{booking_id}/confirm", headers=confirm_headers)
    second = client.post(f"/v1/bookings/{booking_id}/confirm", headers=confirm_headers)
    assert first.json()["status"] == "CONFIRMED"
    assert first.json()["id"] == second.json()["id"]
    assert first.json()["confirmation_code"] == second.json()["confirmation_code"]


def _hotel_item(**overrides):
    item = {
        "service_type": "hotel",
        "entity_id": "hotel_gorgora_resort_a",
        "name": "Gorgora Lakeside Resort",
        "price_etb": 18000,
        "room_id": "room_resort_a_family",
        "check_in": "2026-09-10",
        "check_out": "2026-09-14",
    }
    item.update(overrides)
    return item


def test_hotel_hold_blocks_second_user_and_search(client):
    first = client.post(
        "/v1/bookings/prepare",
        json={"user_id": "user_a", "items": [_hotel_item()]},
        headers={"Idempotency-Key": "hold-a"},
    )
    assert first.status_code == 201
    clash = client.post(
        "/v1/bookings/prepare",
        json={"user_id": "user_b", "items": [_hotel_item()]},
        headers={"Idempotency-Key": "hold-b"},
    )
    assert clash.status_code == 409

    hotels = client.get(
        "/v1/hotels",
        params={
            "destination_id": "dest_gorgora",
            "guests": 6,
            "check_in": "2026-09-10",
            "check_out": "2026-09-14",
        },
    ).json()["results"]
    ids = [row["id"] for row in hotels]
    assert "hotel_gorgora_resort_a" not in ids

    room = client.get(
        "/v1/hotels/hotel_gorgora_resort_a/rooms/room_resort_a_family/availability",
        params={"check_in": "2026-09-10", "check_out": "2026-09-14"},
    ).json()
    assert room["available"] is False

    booking_id = first.json()["id"]
    confirmed = client.post(
        f"/v1/bookings/{booking_id}/confirm",
        headers={"Idempotency-Key": "confirm-a"},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "CONFIRMED"
    still_hidden = client.get(
        "/v1/hotels",
        params={
            "destination_id": "dest_gorgora",
            "guests": 6,
            "check_in": "2026-09-10",
            "check_out": "2026-09-14",
        },
    ).json()["results"]
    assert "hotel_gorgora_resort_a" not in [row["id"] for row in still_hidden]

    cancelled = client.post(
        f"/v1/bookings/{booking_id}/cancel",
        headers={"Idempotency-Key": "cancel-a"},
    )
    assert cancelled.json()["status"] == "CANCELLED"
    restored = client.get(
        "/v1/hotels",
        params={
            "destination_id": "dest_gorgora",
            "guests": 6,
            "check_in": "2026-09-10",
            "check_out": "2026-09-14",
        },
    ).json()["results"]
    assert "hotel_gorgora_resort_a" in [row["id"] for row in restored]


def _vehicle_item(**overrides):
    item = {
        "service_type": "vehicle",
        "entity_id": "vehicle_gorgora_a",
        "name": "Private Land Cruiser with driver",
        "price_etb": 20000,
        "check_in": "2026-09-10",
        "check_out": "2026-09-14",
    }
    item.update(overrides)
    return item


def _tour_item(**overrides):
    item = {
        "service_type": "tour",
        "entity_id": "tour_gorgora_boat_a",
        "name": "Lake Tana Boat Trip A",
        "price_etb": 6000,
        "check_in": "2026-09-10",
        "check_out": "2026-09-10",
    }
    item.update(overrides)
    return item


def test_vehicle_hold_blocks_second_user_and_search(client):
    first = client.post(
        "/v1/bookings/prepare",
        json={"user_id": "user_a", "items": [_vehicle_item()]},
        headers={"Idempotency-Key": "veh-hold-a"},
    )
    assert first.status_code == 201
    clash = client.post(
        "/v1/bookings/prepare",
        json={"user_id": "user_b", "items": [_vehicle_item()]},
        headers={"Idempotency-Key": "veh-hold-b"},
    )
    assert clash.status_code == 409

    cars = client.get(
        "/v1/transport",
        params={
            "destination_id": "dest_gorgora",
            "start_date": "2026-09-10",
            "end_date": "2026-09-14",
        },
    ).json()["results"]
    assert "vehicle_gorgora_a" not in [row["id"] for row in cars]
    avail = client.get(
        "/v1/vehicles/vehicle_gorgora_a/availability",
        params={"start_date": "2026-09-10", "end_date": "2026-09-14"},
    ).json()
    assert avail["available"] is False

    booking_id = first.json()["id"]
    confirmed = client.post(
        f"/v1/bookings/{booking_id}/confirm",
        headers={"Idempotency-Key": "veh-confirm-a"},
    )
    assert confirmed.json()["status"] == "CONFIRMED"
    cancelled = client.post(
        f"/v1/bookings/{booking_id}/cancel",
        headers={"Idempotency-Key": "veh-cancel-a"},
    )
    assert cancelled.json()["status"] == "CANCELLED"
    restored = client.get(
        "/v1/transport",
        params={
            "destination_id": "dest_gorgora",
            "start_date": "2026-09-10",
            "end_date": "2026-09-14",
        },
    ).json()["results"]
    assert "vehicle_gorgora_a" in [row["id"] for row in restored]


def test_tour_hold_blocks_second_user_and_search(client):
    first = client.post(
        "/v1/bookings/prepare",
        json={"user_id": "user_a", "items": [_tour_item()]},
        headers={"Idempotency-Key": "tour-hold-a"},
    )
    assert first.status_code == 201
    clash = client.post(
        "/v1/bookings/prepare",
        json={"user_id": "user_b", "items": [_tour_item()]},
        headers={"Idempotency-Key": "tour-hold-b"},
    )
    assert clash.status_code == 409

    tours = client.get(
        "/v1/tours",
        params={
            "destination_id": "dest_gorgora",
            "check_in": "2026-09-10",
            "check_out": "2026-09-10",
        },
    ).json()["results"]
    assert "tour_gorgora_boat_a" not in [row["id"] for row in tours]
    avail = client.get(
        "/v1/tours/tour_gorgora_boat_a/availability",
        params={"date": "2026-09-10", "guests": 2},
    ).json()
    assert avail["available"] is False

    booking_id = first.json()["id"]
    client.post(
        f"/v1/bookings/{booking_id}/confirm",
        headers={"Idempotency-Key": "tour-confirm-a"},
    )
    cancelled = client.post(
        f"/v1/bookings/{booking_id}/cancel",
        headers={"Idempotency-Key": "tour-cancel-a"},
    )
    assert cancelled.json()["status"] == "CANCELLED"
    restored = client.get(
        "/v1/tours",
        params={
            "destination_id": "dest_gorgora",
            "check_in": "2026-09-10",
            "check_out": "2026-09-10",
        },
    ).json()["results"]
    assert "tour_gorgora_boat_a" in [row["id"] for row in restored]


def test_seeded_destinations(client):
    ids = {row["id"] for row in client.get("/v1/destinations").json()["results"]}
    assert {
        "dest_gorgora",
        "dest_lalibela",
        "dest_gondar",
        "dest_bahir_dar",
        "dest_axum",
        "dest_harar",
        "dest_simien",
        "dest_addis",
        "dest_omo",
    } <= ids


def test_lalibela_hotels_under_5000(client):
    hotels = client.get(
        "/v1/hotels",
        params={"destination_id": "dest_lalibela", "guests": 2, "max_price_etb": 5000},
    ).json()["results"]
    names = {row["name"] for row in hotels}
    assert "Lalibela Guest House" in names
    prices = [
        room["nightly_price_etb"]
        for row in hotels
        for room in row["rooms"]
    ]
    assert prices
    assert all(price <= 5000 for price in prices)


def test_gondar_and_addis_inventory(client):
    gondar_hotels = client.get(
        "/v1/hotels", params={"destination_id": "dest_gondar", "guests": 2}
    ).json()["results"]
    assert {row["id"] for row in gondar_hotels} >= {
        "hotel_gondar_castle",
        "hotel_gondar_budget",
    }
    addis_tours = client.get(
        "/v1/tours", params={"destination_id": "dest_addis", "q": "museum"}
    ).json()["results"]
    assert any(row["id"] == "tour_addis_city" for row in addis_tours)
    omo_cars = client.get(
        "/v1/car-rentals",
        params={"destination_id": "dest_omo", "is_4wd": True},
    ).json()["results"]
    assert any(row["id"] == "vehicle_omo_4wd" for row in omo_cars)
