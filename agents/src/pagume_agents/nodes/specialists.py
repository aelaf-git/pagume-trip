"""Compatibility wrapper around per-agent packages."""

from typing import Any, Callable

from pagume_agents.accommodation.node import make_accommodation_node
from pagume_agents.car_rental.node import make_car_rental_node
from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.destination.node import make_destination_node
from pagume_agents.itinerary.node import make_itinerary_node
from pagume_agents.tour.node import make_tour_node
from pagume_agents.transport.node import make_transport_node


def make_specialist_nodes(
    client: PagumeInventoryClient,
    *,
    llm: Any | None = None,
    use_llm: bool = False,
) -> dict[str, Callable]:
    kwargs = {"llm": llm, "use_llm": use_llm}
    return {
        "destination": make_destination_node(client, **kwargs),
        "accommodation": make_accommodation_node(client, **kwargs),
        "transport": make_transport_node(client, **kwargs),
        "car_rental": make_car_rental_node(client, **kwargs),
        "tour": make_tour_node(client, **kwargs),
        "itinerary": make_itinerary_node(client, **kwargs),
    }
