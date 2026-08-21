from langchain_core.tools import BaseTool

from pagume_agents.accommodation.tools import build_accommodation_tools
from pagume_agents.booking.tools import build_booking_tools
from pagume_agents.car_rental.tools import build_car_rental_tools
from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.destination.tools import build_destination_tools
from pagume_agents.itinerary.tools import build_trip_tools
from pagume_agents.tour.tools import build_tour_tools
from pagume_agents.transport.tools import build_transport_tools


def build_all_tools(
    client: PagumeInventoryClient,
    authorization: dict | None = None,
) -> list[BaseTool]:
    tools: list[BaseTool] = []
    tools.extend(build_destination_tools(client))
    tools.extend(build_accommodation_tools(client))
    tools.extend(build_transport_tools(client))
    tools.extend(build_car_rental_tools(client))
    tools.extend(build_tour_tools(client))
    tools.extend(build_trip_tools(client))
    tools.extend(build_booking_tools(client, authorization=authorization))
    return tools


__all__ = [
    "build_accommodation_tools",
    "build_all_tools",
    "build_booking_tools",
    "build_car_rental_tools",
    "build_destination_tools",
    "build_tour_tools",
    "build_transport_tools",
    "build_trip_tools",
]
