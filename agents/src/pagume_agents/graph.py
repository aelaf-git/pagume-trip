from __future__ import annotations

from functools import lru_cache
from typing import Any

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from pagume_agents.accommodation.node import make_accommodation_node
from pagume_agents.booking.node import make_booking_node
from pagume_agents.budget.node import budget_node
from pagume_agents.car_rental.node import make_car_rental_node
from pagume_agents.clients import get_inventory_client
from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.config import Settings, get_settings
from pagume_agents.destination.node import make_destination_node
from pagume_agents.itinerary.node import make_itinerary_node
from pagume_agents.llm import get_chat_model
from pagume_agents.respond.node import respond_node
from pagume_agents.state import TripState
from pagume_agents.supervisor.node import make_supervisor_node, route_from_supervisor
from pagume_agents.tour.node import make_tour_node
from pagume_agents.transport.node import make_transport_node


def build_graph(
    client: PagumeInventoryClient | None = None,
    *,
    llm: Any | None = None,
    use_llm: bool = False,
    checkpointer: MemorySaver | None = None,
):
    client = client or get_inventory_client()
    kwargs = {"llm": llm, "use_llm": use_llm}

    graph = StateGraph(TripState)
    graph.add_node("supervisor", make_supervisor_node(llm=llm, use_llm=use_llm))
    graph.add_node("destination", make_destination_node(client, **kwargs))
    graph.add_node("accommodation", make_accommodation_node(client, **kwargs))
    graph.add_node("transport", make_transport_node(client, **kwargs))
    graph.add_node("car_rental", make_car_rental_node(client, **kwargs))
    graph.add_node("tour", make_tour_node(client, **kwargs))
    graph.add_node("budget", budget_node)
    graph.add_node("itinerary", make_itinerary_node(client, **kwargs))
    graph.add_node("booking", make_booking_node(client))
    graph.add_node("respond", respond_node)

    graph.add_edge(START, "supervisor")
    graph.add_conditional_edges(
        "supervisor",
        route_from_supervisor,
        {
            "destination": "destination",
            "accommodation": "accommodation",
            "transport": "transport",
            "car_rental": "car_rental",
            "tour": "tour",
            "budget": "budget",
            "itinerary": "itinerary",
            "booking": "booking",
            "respond": "respond",
        },
    )
    for node in (
        "destination",
        "accommodation",
        "transport",
        "car_rental",
        "tour",
        "budget",
        "itinerary",
        "booking",
    ):
        graph.add_edge(node, "supervisor")
    graph.add_edge("respond", END)

    return graph.compile(checkpointer=checkpointer or MemorySaver())


def compile_app(settings: Settings | None = None, client: PagumeInventoryClient | None = None):
    settings = settings or get_settings()
    llm = None
    use_llm = settings.use_llm
    if use_llm:
        if not settings.llm_api_key:
            use_llm = False
        else:
            llm = get_chat_model(settings)
    return build_graph(
        client=client or get_inventory_client(settings),
        llm=llm,
        use_llm=use_llm,
    )


@lru_cache
def get_compiled_graph():
    return compile_app()
