from __future__ import annotations

import time
from typing import Any, Callable

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.itinerary.prompt import PROMPT
from pagume_agents.itinerary.tools import build_trip_tools
from pagume_agents.models.trip import ItineraryItem, Trip, TripContext
from pagume_agents.observability import make_event, make_progress
from pagume_agents.shared.react import maybe_react_agent
from pagume_agents.state import TripState


def make_itinerary_node(
    client: PagumeInventoryClient,
    *,
    llm: Any | None = None,
    use_llm: bool = False,
) -> Callable:
    react_agent = maybe_react_agent(llm, build_trip_tools(client), PROMPT, use_llm)

    def itinerary_node(state: TripState) -> dict[str, Any]:
        started = time.perf_counter()
        ctx = TripContext.model_validate(state.get("trip_context") or {})
        option = state.get("selected_option") or {}
        days = ctx.duration_days or 1
        dest_name = ctx.destination_name or "the destination"
        hotel_item = next(
            (i for i in option.get("items", []) if i.get("kind") == "hotel"), None
        )
        vehicle_item = next(
            (i for i in option.get("items", []) if i.get("kind") == "vehicle"), None
        )
        tour_item = next(
            (i for i in option.get("items", []) if i.get("kind") == "tour"), None
        )

        items: list[dict[str, Any]] = []
        items.append(
            {
                "day": 1,
                "time": "afternoon",
                "title": f"Travel and check-in in {dest_name}",
                "description": "Arrive and check in.",
                "entity_type": "hotel" if hotel_item else None,
                "entity_id": hotel_item["entity_id"] if hotel_item else None,
            }
        )
        if days >= 2:
            items.append(
                {
                    "day": 2,
                    "time": "morning",
                    "title": tour_item["name"] if tour_item else f"Explore {dest_name}",
                    "description": "Guided activity from Pagume inventory.",
                    "entity_type": "tour" if tour_item else None,
                    "entity_id": tour_item["entity_id"] if tour_item else None,
                }
            )
        if days >= 3:
            items.append(
                {
                    "day": 3,
                    "time": "morning",
                    "title": f"Cultural activities in {dest_name}",
                    "description": "Free day using local verified providers.",
                    "entity_type": "destination",
                    "entity_id": ctx.destination_id,
                }
            )
        items.append(
            {
                "day": days,
                "time": "morning",
                "title": "Breakfast, check-out, and return",
                "description": "Depart with reserved transportation."
                if vehicle_item
                else "Depart.",
                "entity_type": "vehicle" if vehicle_item else None,
                "entity_id": vehicle_item["entity_id"] if vehicle_item else None,
            }
        )

        parsed_items = [ItineraryItem.model_validate(item) for item in items]
        trip = client.create_trip(
            Trip(
                id="",
                destination_id=ctx.destination_id,
                total_etb=option.get("total_etb") or 0,
                itinerary=parsed_items,
            )
        )
        trip = client.update_itinerary(trip.id, parsed_items)
        return {
            "itinerary": items,
            "trip": trip.model_dump(mode="json"),
            "agent_results": {"itinerary": {"status": "success", "results": items}},
            "progress": [make_progress("Building itinerary")],
            "events": [
                make_event(
                    agent="itinerary",
                    task="build",
                    input={"days": days},
                    tool_name="update_itinerary",
                    result_summary={"trip_id": trip.id, "days": len(items)},
                    duration_ms=(time.perf_counter() - started) * 1000,
                )
            ],
        }

    itinerary_node.react_agent = react_agent  # type: ignore[attr-defined]
    return itinerary_node
