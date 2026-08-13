from __future__ import annotations

import time
from typing import Any, Callable

from pagume_agents.car_rental.prompt import PROMPT
from pagume_agents.car_rental.tools import build_car_rental_tools
from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event, make_progress
from pagume_agents.shared.react import maybe_react_agent
from pagume_agents.shared.results import summarize_inventory
from pagume_agents.state import TripState


def make_car_rental_node(
    client: PagumeInventoryClient,
    *,
    llm: Any | None = None,
    use_llm: bool = False,
) -> Callable:
    react_agent = maybe_react_agent(
        llm, build_car_rental_tools(client), PROMPT, use_llm
    )

    def car_rental_node(state: TripState) -> dict[str, Any]:
        started = time.perf_counter()
        ctx = TripContext.model_validate(state.get("trip_context") or {})
        dest_id = ctx.destination_id or ""
        vehicles = client.search_car_rentals(destination_id=dest_id, seats=ctx.guests)
        rows = [v.model_dump() for v in vehicles]
        return {
            "agent_results": {
                "car_rental": {"status": "success" if rows else "empty", "results": rows}
            },
            "progress": [make_progress("Searching car rentals")],
            "events": [
                make_event(
                    agent="car_rental",
                    task="search",
                    input={"destination_id": dest_id},
                    tool_name="search_car_rentals",
                    result_summary=summarize_inventory(rows),
                    duration_ms=(time.perf_counter() - started) * 1000,
                )
            ],
        }

    car_rental_node.react_agent = react_agent  # type: ignore[attr-defined]
    return car_rental_node
