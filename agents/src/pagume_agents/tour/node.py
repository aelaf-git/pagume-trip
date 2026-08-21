from __future__ import annotations

import time
from typing import Any, Callable

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event, make_progress
from pagume_agents.shared.react import maybe_react_agent
from pagume_agents.shared.results import summarize_inventory
from pagume_agents.state import TripState
from pagume_agents.tour.prompt import PROMPT
from pagume_agents.tour.tools import build_tour_tools


def make_tour_node(
    client: PagumeInventoryClient,
    *,
    llm: Any | None = None,
    use_llm: bool = False,
) -> Callable:
    react_agent = maybe_react_agent(llm, build_tour_tools(client), PROMPT, use_llm)

    def tour_node(state: TripState) -> dict[str, Any]:
        started = time.perf_counter()
        ctx = TripContext.model_validate(state.get("trip_context") or {})
        dest_id = ctx.destination_id or ""
        if not dest_id:
            return {
                "agent_results": {"tour": {"status": "error", "results": []}},
                "errors": [{"agent": "tour", "message": "Missing destination_id"}],
                "progress": [make_progress("Finding tours", "error")],
            }
        tours = client.search_tour_packages(
            destination_id=dest_id,
            query=ctx.tour_query,
            guests=ctx.guests,
            check_in=ctx.check_in,
            check_out=ctx.check_out,
        )
        rows = [t.model_dump() for t in tours]
        return {
            "agent_results": {
                "tour": {"status": "success" if rows else "empty", "results": rows}
            },
            "progress": [make_progress("Finding tours")],
            "events": [
                make_event(
                    agent="tour",
                    task="search",
                    input={"destination_id": dest_id, "query": ctx.tour_query},
                    tool_name="search_tour_packages",
                    result_summary=summarize_inventory(rows),
                    duration_ms=(time.perf_counter() - started) * 1000,
                )
            ],
        }

    tour_node.react_agent = react_agent  # type: ignore[attr-defined]
    return tour_node
