from typing import Protocol, runtime_checkable

from pagume_agents.models.booking import Booking
from pagume_agents.models.inventory import Destination, Hotel, HotelRoom, TourPackage, Vehicle
from pagume_agents.models.trip import ItineraryItem, Trip


@runtime_checkable
class PagumeInventoryClient(Protocol):
    """Inventory and booking access. Agents must not bypass this with SQL."""

    def search_destinations(
        self,
        query: str,
        region: str | None = None,
    ) -> list[Destination]: ...

    def get_destination(self, destination_id: str) -> Destination | None: ...

    def find_nearby_destinations(
        self,
        destination_id: str,
        radius_km: float = 100,
    ) -> list[Destination]: ...

    def search_hotels(
        self,
        destination_id: str,
        guests: int | None = None,
        max_price_etb: float | None = None,
        check_in: str | None = None,
        check_out: str | None = None,
    ) -> list[Hotel]: ...

    def get_hotel_details(self, hotel_id: str) -> Hotel | None: ...

    def search_rooms(
        self,
        hotel_id: str,
        guests: int | None = None,
        max_price_etb: float | None = None,
    ) -> list[HotelRoom]: ...

    def check_hotel_availability(
        self,
        hotel_id: str,
        room_id: str,
        check_in: str,
        check_out: str,
    ) -> bool: ...

    def search_transport(
        self,
        destination_id: str,
        seats: int | None = None,
        service_type: str | None = None,
    ) -> list[Vehicle]: ...

    def search_car_rentals(
        self,
        destination_id: str,
        seats: int | None = None,
        is_4wd: bool | None = None,
    ) -> list[Vehicle]: ...

    def check_vehicle_availability(
        self,
        vehicle_id: str,
        start_date: str,
        end_date: str,
    ) -> bool: ...

    def search_tour_packages(
        self,
        destination_id: str,
        query: str | None = None,
        guests: int | None = None,
    ) -> list[TourPackage]: ...

    def get_package_details(self, package_id: str) -> TourPackage | None: ...

    def check_tour_availability(
        self,
        package_id: str,
        date: str,
        guests: int,
    ) -> bool: ...

    def create_trip(self, trip: Trip) -> Trip: ...

    def update_itinerary(self, trip_id: str, items: list[ItineraryItem]) -> Trip: ...

    def prepare_booking(
        self,
        items: list[dict],
        *,
        user_id: str | None = None,
        idempotency_key: str,
    ) -> Booking: ...

    def confirm_booking(
        self,
        booking_id: str,
        *,
        idempotency_key: str,
    ) -> Booking: ...

    def cancel_booking(
        self,
        booking_id: str,
        *,
        idempotency_key: str,
    ) -> Booking: ...
