"""HTTP adapter for the future Pagume API. Same protocol as the mock client."""

from __future__ import annotations

import httpx

from pagume_agents.models.booking import Booking
from pagume_agents.models.inventory import Destination, Hotel, HotelRoom, TourPackage, Vehicle
from pagume_agents.models.trip import ItineraryItem, Trip


def _query_params(params: dict) -> dict:
    """Omit None/empty values so FastAPI does not 422 on ``?check_in=``."""
    return {key: value for key, value in params.items() if value is not None and value != ""}


class HttpInventoryClient:
    """Calls Pagume REST endpoints. Teammates implement the matching API."""

    def __init__(self, base_url: str, timeout: float = 15.0) -> None:
        self.base_url = (base_url or "").rstrip("/")
        self.timeout = timeout

    def _require_base(self) -> str:
        if not self.base_url:
            raise NotImplementedError(
                "PAGUME_API_BASE_URL is not configured. "
                "Use MockInventoryClient until the Pagume API exists."
            )
        return self.base_url

    def _client(self) -> httpx.Client:
        return httpx.Client(base_url=self._require_base(), timeout=self.timeout)

    def search_destinations(
        self, query: str, region: str | None = None
    ) -> list[Destination]:
        with self._client() as client:
            response = client.get(
                "/v1/destinations",
                params=_query_params({"q": query, "region": region}),
            )
            response.raise_for_status()
            return [Destination.model_validate(row) for row in response.json()["results"]]

    def get_destination(self, destination_id: str) -> Destination | None:
        with self._client() as client:
            response = client.get(f"/v1/destinations/{destination_id}")
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return Destination.model_validate(response.json())

    def find_nearby_destinations(
        self, destination_id: str, radius_km: float = 100
    ) -> list[Destination]:
        with self._client() as client:
            response = client.get(
                f"/v1/destinations/{destination_id}/nearby",
                params={"radius_km": radius_km},
            )
            response.raise_for_status()
            return [Destination.model_validate(row) for row in response.json()["results"]]

    def search_hotels(
        self,
        destination_id: str,
        guests: int | None = None,
        max_price_etb: float | None = None,
        check_in: str | None = None,
        check_out: str | None = None,
    ) -> list[Hotel]:
        with self._client() as client:
            response = client.get(
                "/v1/hotels",
                params=_query_params(
                    {
                        "destination_id": destination_id,
                        "guests": guests,
                        "max_price_etb": max_price_etb,
                        "check_in": check_in,
                        "check_out": check_out,
                    }
                ),
            )
            response.raise_for_status()
            return [Hotel.model_validate(row) for row in response.json()["results"]]

    def get_hotel_details(self, hotel_id: str) -> Hotel | None:
        with self._client() as client:
            response = client.get(f"/v1/hotels/{hotel_id}")
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return Hotel.model_validate(response.json())

    def search_rooms(
        self,
        hotel_id: str,
        guests: int | None = None,
        max_price_etb: float | None = None,
    ) -> list[HotelRoom]:
        with self._client() as client:
            response = client.get(
                f"/v1/hotels/{hotel_id}/rooms",
                params=_query_params({"guests": guests, "max_price_etb": max_price_etb}),
            )
            response.raise_for_status()
            return [HotelRoom.model_validate(row) for row in response.json()["results"]]

    def check_hotel_availability(
        self, hotel_id: str, room_id: str, check_in: str, check_out: str
    ) -> bool:
        with self._client() as client:
            response = client.get(
                f"/v1/hotels/{hotel_id}/rooms/{room_id}/availability",
                params={"check_in": check_in, "check_out": check_out},
            )
            response.raise_for_status()
            return bool(response.json()["available"])

    def search_transport(
        self,
        destination_id: str,
        seats: int | None = None,
        service_type: str | None = None,
    ) -> list[Vehicle]:
        with self._client() as client:
            response = client.get(
                "/v1/transport",
                params=_query_params(
                    {
                        "destination_id": destination_id,
                        "seats": seats,
                        "service_type": service_type,
                    }
                ),
            )
            response.raise_for_status()
            return [Vehicle.model_validate(row) for row in response.json()["results"]]

    def search_car_rentals(
        self,
        destination_id: str,
        seats: int | None = None,
        is_4wd: bool | None = None,
    ) -> list[Vehicle]:
        with self._client() as client:
            response = client.get(
                "/v1/car-rentals",
                params=_query_params(
                    {
                        "destination_id": destination_id,
                        "seats": seats,
                        "is_4wd": is_4wd,
                    }
                ),
            )
            response.raise_for_status()
            return [Vehicle.model_validate(row) for row in response.json()["results"]]

    def check_vehicle_availability(
        self, vehicle_id: str, start_date: str, end_date: str
    ) -> bool:
        with self._client() as client:
            response = client.get(
                f"/v1/vehicles/{vehicle_id}/availability",
                params={"start_date": start_date, "end_date": end_date},
            )
            response.raise_for_status()
            return bool(response.json()["available"])

    def search_tour_packages(
        self,
        destination_id: str,
        query: str | None = None,
        guests: int | None = None,
    ) -> list[TourPackage]:
        with self._client() as client:
            response = client.get(
                "/v1/tours",
                params=_query_params(
                    {
                        "destination_id": destination_id,
                        "q": query,
                        "guests": guests,
                    }
                ),
            )
            response.raise_for_status()
            return [TourPackage.model_validate(row) for row in response.json()["results"]]

    def get_package_details(self, package_id: str) -> TourPackage | None:
        with self._client() as client:
            response = client.get(f"/v1/tours/{package_id}")
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return TourPackage.model_validate(response.json())

    def check_tour_availability(
        self, package_id: str, date: str, guests: int
    ) -> bool:
        with self._client() as client:
            response = client.get(
                f"/v1/tours/{package_id}/availability",
                params={"date": date, "guests": guests},
            )
            response.raise_for_status()
            return bool(response.json()["available"])

    def create_trip(self, trip: Trip) -> Trip:
        with self._client() as client:
            response = client.post("/v1/trips", json=trip.model_dump())
            response.raise_for_status()
            return Trip.model_validate(response.json())

    def update_itinerary(self, trip_id: str, items: list[ItineraryItem]) -> Trip:
        with self._client() as client:
            response = client.put(
                f"/v1/trips/{trip_id}/itinerary",
                json=[item.model_dump() for item in items],
            )
            response.raise_for_status()
            return Trip.model_validate(response.json())

    def prepare_booking(
        self,
        items: list[dict],
        *,
        user_id: str | None = None,
        idempotency_key: str,
    ) -> Booking:
        with self._client() as client:
            response = client.post(
                "/v1/bookings/prepare",
                json={"items": items, "user_id": user_id},
                headers={"Idempotency-Key": idempotency_key},
            )
            response.raise_for_status()
            return Booking.model_validate(response.json())

    def confirm_booking(self, booking_id: str, *, idempotency_key: str) -> Booking:
        with self._client() as client:
            response = client.post(
                f"/v1/bookings/{booking_id}/confirm",
                headers={"Idempotency-Key": idempotency_key},
            )
            response.raise_for_status()
            return Booking.model_validate(response.json())

    def cancel_booking(self, booking_id: str, *, idempotency_key: str) -> Booking:
        with self._client() as client:
            response = client.post(
                f"/v1/bookings/{booking_id}/cancel",
                headers={"Idempotency-Key": idempotency_key},
            )
            response.raise_for_status()
            return Booking.model_validate(response.json())
