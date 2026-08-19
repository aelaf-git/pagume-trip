from __future__ import annotations

import json
from datetime import date, datetime, timedelta, UTC
from pathlib import Path
from uuid import uuid4

from pagume_agents.clients.errors import InventoryUnavailableError
from pagume_agents.clients.geo import destination_search_rank, haversine_km
from pagume_agents.models.booking import Booking, BookingItem, BookingStatus
from pagume_agents.models.inventory import Destination, Hotel, HotelRoom, TourPackage, Vehicle
from pagume_agents.models.trip import ItineraryItem, Trip

DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "mock"


def _load_json(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


HOLD_TTL = timedelta(minutes=15)


def _date_range(check_in: str, check_out: str) -> list[str]:
    start = date.fromisoformat(check_in)
    end = date.fromisoformat(check_out)
    if end <= start:
        return [check_in]
    days: list[str] = []
    current = start
    while current < end:
        days.append(current.isoformat())
        current += timedelta(days=1)
    return days


class MockInventoryClient:
    """In-memory verified inventory. Empty searches return [] — never invented rows."""

    def __init__(self, data_dir: Path | None = None, empty: bool = False) -> None:
        self.data_dir = data_dir or DEFAULT_DATA_DIR
        self.destinations: list[Destination] = []
        self.hotels: list[Hotel] = []
        self.vehicles: list[Vehicle] = []
        self.tours: list[TourPackage] = []
        self.trips: dict[str, Trip] = {}
        self.bookings: dict[str, Booking] = {}
        self._idempotency: dict[str, str] = {}
        self._reservations: dict[tuple[str, str], dict] = {}
        self._vehicle_reservations: dict[tuple[str, str], dict] = {}
        self._tour_reservations: dict[tuple[str, str], dict] = {}
        self.confirm_calls: int = 0
        if not empty:
            self._load()

    def _load(self) -> None:
        self.destinations = [
            Destination.model_validate(row)
            for row in _load_json(self.data_dir / "destinations.json")
        ]
        self.hotels = [
            Hotel.model_validate(row) for row in _load_json(self.data_dir / "hotels.json")
        ]
        self.vehicles = [
            Vehicle.model_validate(row)
            for row in _load_json(self.data_dir / "vehicles.json")
        ]
        self.tours = [
            TourPackage.model_validate(row)
            for row in _load_json(self.data_dir / "tours.json")
        ]

    def search_destinations(
        self,
        query: str,
        region: str | None = None,
    ) -> list[Destination]:
        q = (query or "").strip().lower()
        scored: list[tuple[int, Destination]] = []
        for dest in self.destinations:
            if dest.verification_status != "VERIFIED":
                continue
            haystack = " ".join(
                [dest.name, dest.description, dest.region, dest.zone, dest.woreda or ""]
            )
            rank = destination_search_rank(dest.name, haystack, q)
            if rank is None:
                continue
            if region and region.lower() not in dest.region.lower():
                continue
            scored.append((rank, dest))
        scored.sort(key=lambda item: (item[0], item[1].name))
        return [dest for _, dest in scored]

    def get_destination(self, destination_id: str) -> Destination | None:
        return next((d for d in self.destinations if d.id == destination_id), None)

    def find_nearby_destinations(
        self,
        destination_id: str,
        radius_km: float = 100,
    ) -> list[Destination]:
        origin = self.get_destination(destination_id)
        if origin is None:
            return []
        nearby: list[Destination] = []
        for dest in self.destinations:
            if dest.id == origin.id:
                continue
            distance = haversine_km(
                origin.latitude, origin.longitude, dest.latitude, dest.longitude
            )
            if distance <= radius_km:
                nearby.append(dest)
        return nearby

    def search_hotels(
        self,
        destination_id: str,
        guests: int | None = None,
        max_price_etb: float | None = None,
        check_in: str | None = None,
        check_out: str | None = None,
    ) -> list[Hotel]:
        results: list[Hotel] = []
        for hotel in self.hotels:
            if hotel.destination_id != destination_id:
                continue
            if hotel.provider_status != "VERIFIED":
                continue
            rooms = hotel.rooms
            if guests is not None:
                rooms = [r for r in rooms if r.capacity >= guests]
            if max_price_etb is not None:
                rooms = [r for r in rooms if r.nightly_price_etb <= max_price_etb]
            if not rooms:
                continue
            if check_in and check_out:
                needed = _date_range(check_in, check_out)
                if any(day not in hotel.available_dates for day in needed):
                    continue
                taken = self._reserved_rooms(needed)
                rooms = [r for r in rooms if r.id not in taken]
                if not rooms:
                    continue
            filtered = hotel.model_copy(deep=True)
            filtered.rooms = rooms
            results.append(filtered)
        return results

    def get_hotel_details(self, hotel_id: str) -> Hotel | None:
        return next((h for h in self.hotels if h.id == hotel_id), None)

    def search_rooms(
        self,
        hotel_id: str,
        guests: int | None = None,
        max_price_etb: float | None = None,
    ) -> list[HotelRoom]:
        hotel = self.get_hotel_details(hotel_id)
        if hotel is None:
            return []
        rooms = hotel.rooms
        if guests is not None:
            rooms = [r for r in rooms if r.capacity >= guests]
        if max_price_etb is not None:
            rooms = [r for r in rooms if r.nightly_price_etb <= max_price_etb]
        return rooms

    def check_hotel_availability(
        self,
        hotel_id: str,
        room_id: str,
        check_in: str,
        check_out: str,
    ) -> bool:
        hotel = self.get_hotel_details(hotel_id)
        if hotel is None:
            return False
        if not any(r.id == room_id for r in hotel.rooms):
            return False
        needed = _date_range(check_in, check_out)
        if any(day not in hotel.available_dates for day in needed):
            return False
        return room_id not in self._reserved_rooms(needed)

    def _expire_holds(self) -> None:
        cutoff = datetime.now(UTC).replace(tzinfo=None) - HOLD_TTL
        for store in (
            self._reservations,
            self._vehicle_reservations,
            self._tour_reservations,
        ):
            stale = [
                key
                for key, row in store.items()
                if row["status"] == "HOLD" and row["created_at"] < cutoff
            ]
            for key in stale:
                del store[key]

    def _taken_ids(self, store: dict[tuple[str, str], dict], nights: list[str]) -> set[str]:
        self._expire_holds()
        needed = set(nights)
        taken: set[str] = set()
        for (entity_id, day), row in store.items():
            if day in needed and row["status"] in {"HOLD", "CONFIRMED"}:
                taken.add(entity_id)
        return taken

    def _reserved_rooms(self, nights: list[str]) -> set[str]:
        return self._taken_ids(self._reservations, nights)

    def _hold_nights(self, booking: Booking) -> None:
        self._expire_holds()
        pending_rooms: list[tuple[str, str]] = []
        pending_vehicles: list[tuple[str, str]] = []
        pending_tours: list[tuple[str, str]] = []
        now = datetime.now(UTC).replace(tzinfo=None)
        for item in booking.items:
            if item.service_type == "hotel":
                if not item.room_id or not item.check_in or not item.check_out:
                    raise ValueError("Hotel items require room_id, check_in, and check_out")
                hotel = self.get_hotel_details(item.entity_id)
                if hotel is None or not any(r.id == item.room_id for r in hotel.rooms):
                    raise ValueError("Room does not belong to this hotel")
                for day in _date_range(item.check_in, item.check_out):
                    key = (item.room_id, day)
                    if key in self._reservations:
                        raise InventoryUnavailableError(
                            "Room is no longer available for those dates"
                        )
                    pending_rooms.append(key)
            elif item.service_type == "vehicle":
                if not item.check_in or not item.check_out:
                    raise ValueError("Vehicle items require check_in and check_out")
                if not any(v.id == item.entity_id for v in self.vehicles):
                    raise ValueError("Unknown vehicle")
                for day in _date_range(item.check_in, item.check_out):
                    key = (item.entity_id, day)
                    if key in self._vehicle_reservations:
                        raise InventoryUnavailableError(
                            "Vehicle is no longer available for those dates"
                        )
                    pending_vehicles.append(key)
            elif item.service_type == "tour":
                if not item.check_in:
                    raise ValueError("Tour items require check_in")
                if not any(t.id == item.entity_id for t in self.tours):
                    raise ValueError("Unknown tour")
                end = item.check_out or item.check_in
                for day in _date_range(item.check_in, end):
                    key = (item.entity_id, day)
                    if key in self._tour_reservations:
                        raise InventoryUnavailableError(
                            "Tour is no longer available for those dates"
                        )
                    pending_tours.append(key)
        for key in pending_rooms:
            self._reservations[key] = {
                "booking_id": booking.id,
                "status": "HOLD",
                "created_at": now,
            }
        for key in pending_vehicles:
            self._vehicle_reservations[key] = {
                "booking_id": booking.id,
                "status": "HOLD",
                "created_at": now,
            }
        for key in pending_tours:
            self._tour_reservations[key] = {
                "booking_id": booking.id,
                "status": "HOLD",
                "created_at": now,
            }

    def _filter_vehicles(
        self,
        destination_id: str,
        seats: int | None = None,
        service_type: str | None = None,
        is_4wd: bool | None = None,
        driver_included: bool | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[Vehicle]:
        needed = _date_range(start_date, end_date) if start_date and end_date else None
        taken = self._taken_ids(self._vehicle_reservations, needed) if needed else set()
        results: list[Vehicle] = []
        for vehicle in self.vehicles:
            if vehicle.destination_id != destination_id:
                continue
            if vehicle.provider_status != "VERIFIED":
                continue
            if seats is not None and vehicle.seats < seats:
                continue
            if service_type and vehicle.service_type != service_type:
                continue
            if is_4wd is not None and vehicle.is_4wd != is_4wd:
                continue
            if driver_included is not None and vehicle.driver_included != driver_included:
                continue
            if needed:
                if any(day not in vehicle.available_dates for day in needed):
                    continue
                if vehicle.id in taken:
                    continue
            results.append(vehicle)
        return results

    def search_transport(
        self,
        destination_id: str,
        seats: int | None = None,
        service_type: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[Vehicle]:
        return self._filter_vehicles(
            destination_id,
            seats=seats,
            service_type=service_type,
            start_date=start_date,
            end_date=end_date,
        )

    def search_car_rentals(
        self,
        destination_id: str,
        seats: int | None = None,
        is_4wd: bool | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[Vehicle]:
        return self._filter_vehicles(
            destination_id,
            seats=seats,
            is_4wd=is_4wd,
            start_date=start_date,
            end_date=end_date,
        )

    def check_vehicle_availability(
        self,
        vehicle_id: str,
        start_date: str,
        end_date: str,
    ) -> bool:
        vehicle = next((v for v in self.vehicles if v.id == vehicle_id), None)
        if vehicle is None:
            return False
        needed = _date_range(start_date, end_date)
        if any(day not in vehicle.available_dates for day in needed):
            return False
        return vehicle_id not in self._taken_ids(self._vehicle_reservations, needed)

    def search_tour_packages(
        self,
        destination_id: str,
        query: str | None = None,
        guests: int | None = None,
        check_in: str | None = None,
        check_out: str | None = None,
    ) -> list[TourPackage]:
        q = (query or "").strip().lower()
        needed = _date_range(check_in, check_out or check_in) if check_in else None
        taken = self._taken_ids(self._tour_reservations, needed) if needed else set()
        results: list[TourPackage] = []
        for tour in self.tours:
            if tour.destination_id != destination_id:
                continue
            if tour.provider_status != "VERIFIED":
                continue
            if guests is not None and (
                guests > tour.max_participants or guests > tour.seats_remaining
            ):
                continue
            haystack = " ".join(
                [tour.name, tour.description, tour.category, " ".join(tour.included)]
            ).lower()
            if q and q not in haystack:
                continue
            if needed:
                if any(day not in tour.available_dates for day in needed):
                    continue
                if tour.id in taken:
                    continue
            results.append(tour)
        return results

    def get_package_details(self, package_id: str) -> TourPackage | None:
        return next((t for t in self.tours if t.id == package_id), None)

    def check_tour_availability(
        self,
        package_id: str,
        date: str,
        guests: int,
    ) -> bool:
        tour = self.get_package_details(package_id)
        if tour is None:
            return False
        if guests > tour.seats_remaining or guests > tour.max_participants:
            return False
        if date not in tour.available_dates:
            return False
        return package_id not in self._taken_ids(self._tour_reservations, [date])

    def create_trip(self, trip: Trip) -> Trip:
        if not trip.id:
            trip = trip.model_copy(update={"id": f"trip_{uuid4().hex[:8]}"})
        self.trips[trip.id] = trip
        return trip

    def update_itinerary(self, trip_id: str, items: list[ItineraryItem]) -> Trip:
        trip = self.trips.get(trip_id)
        if trip is None:
            trip = Trip(id=trip_id, itinerary=items)
        else:
            trip = trip.model_copy(update={"itinerary": items})
        self.trips[trip_id] = trip
        return trip

    def prepare_booking(
        self,
        items: list[dict],
        *,
        user_id: str | None = None,
        idempotency_key: str,
    ) -> Booking:
        if idempotency_key in self._idempotency:
            return self.bookings[self._idempotency[idempotency_key]]
        booking_items = [BookingItem.model_validate(item) for item in items]
        total = sum(item.price_etb for item in booking_items)
        booking = Booking(
            id=f"bkg_{uuid4().hex[:8]}",
            user_id=user_id,
            items=booking_items,
            price_etb=total,
            status=BookingStatus.PENDING,
            idempotency_key=idempotency_key,
        )
        self._hold_nights(booking)
        self.bookings[booking.id] = booking
        self._idempotency[idempotency_key] = booking.id
        return booking

    def confirm_booking(
        self,
        booking_id: str,
        *,
        idempotency_key: str,
    ) -> Booking:
        self.confirm_calls += 1
        existing_id = self._idempotency.get(f"confirm:{idempotency_key}")
        if existing_id:
            return self.bookings[existing_id]
        booking = self.bookings.get(booking_id)
        if booking is None:
            raise KeyError(f"Unknown booking {booking_id}")
        if booking.status == BookingStatus.CONFIRMED:
            self._idempotency[f"confirm:{idempotency_key}"] = booking.id
            return booking
        self._expire_holds()
        stores = (
            self._reservations,
            self._vehicle_reservations,
            self._tour_reservations,
        )
        held = [
            row
            for store in stores
            for row in store.values()
            if row["booking_id"] == booking.id
        ]
        if booking.items and not held:
            raise InventoryUnavailableError("Hold expired; inventory is no longer available")
        for row in held:
            row["status"] = "CONFIRMED"
        updated = booking.model_copy(
            update={
                "status": BookingStatus.CONFIRMED,
                "confirmation_code": f"PT-{booking.id[-5:].upper()}",
                "payment_status": "AUTHORIZED",
            }
        )
        self.bookings[booking.id] = updated
        self._idempotency[f"confirm:{idempotency_key}"] = booking.id
        return updated

    def cancel_booking(
        self,
        booking_id: str,
        *,
        idempotency_key: str,
    ) -> Booking:
        existing_id = self._idempotency.get(f"cancel:{idempotency_key}")
        if existing_id:
            return self.bookings[existing_id]
        booking = self.bookings.get(booking_id)
        if booking is None:
            raise KeyError(f"Unknown booking {booking_id}")
        for store in (
            self._reservations,
            self._vehicle_reservations,
            self._tour_reservations,
        ):
            drop = [key for key, row in store.items() if row["booking_id"] == booking.id]
            for key in drop:
                del store[key]
        updated = booking.model_copy(update={"status": BookingStatus.CANCELLED})
        self.bookings[booking.id] = updated
        self._idempotency[f"cancel:{idempotency_key}"] = booking.id
        return updated
