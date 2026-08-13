from langchain_core.tools import StructuredTool

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.models.trip import ItineraryItem, Trip
from pagume_agents.permissions import Permission


def build_trip_tools(client: PagumeInventoryClient) -> list[StructuredTool]:
    def create_trip(
        destination_id: str | None = None,
        user_id: str | None = None,
        total_etb: float = 0,
    ) -> dict:
        """Create a draft trip record."""
        trip = client.create_trip(
            Trip(
                id="",
                user_id=user_id,
                destination_id=destination_id,
                total_etb=total_etb,
            )
        )
        return trip.model_dump()

    def update_itinerary(trip_id: str, items: list[dict]) -> dict:
        """Replace itinerary items on a trip with structured day entries."""
        parsed = [ItineraryItem.model_validate(item) for item in items]
        trip = client.update_itinerary(trip_id, parsed)
        return trip.model_dump()

    def calculate_trip_cost(
        hotel_cost_etb: float = 0,
        vehicle_cost_etb: float = 0,
        tour_cost_etb: float = 0,
        extra_etb: float = 0,
    ) -> dict:
        """Sum trip component costs in ETB. Deterministic; do not estimate."""
        total = hotel_cost_etb + vehicle_cost_etb + tour_cost_etb + extra_etb
        return {
            "hotel_cost_etb": hotel_cost_etb,
            "vehicle_cost_etb": vehicle_cost_etb,
            "tour_cost_etb": tour_cost_etb,
            "extra_etb": extra_etb,
            "total_etb": total,
            "currency": "ETB",
        }

    create = StructuredTool.from_function(
        create_trip,
        name="create_trip",
        description="Create a draft trip in Pagume.",
    )
    create.metadata = {"permission": Permission.PREPARE}

    update = StructuredTool.from_function(
        update_itinerary,
        name="update_itinerary",
        description="Save structured itinerary items on a trip.",
    )
    update.metadata = {"permission": Permission.PREPARE}

    cost = StructuredTool.from_function(
        calculate_trip_cost,
        name="calculate_trip_cost",
        description="Sum hotel, vehicle, and tour costs in ETB.",
    )
    cost.metadata = {"permission": Permission.READ}
    return [create, update, cost]
