from __future__ import annotations

import time
from typing import Any, Callable

from pagume_agents.accommodation.prompt import PROMPT
from pagume_agents.accommodation.tools import build_accommodation_tools
from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event, make_progress
from pagume_agents.shared.react import maybe_react_agent
from pagume_agents.shared.results import summarize_inventory
from pagume_agents.state import TripState


def make_accommodation_node(
    client: PagumeInventoryClient,
    *,
    llm: Any | None = None,
    use_llm: bool = False,
) -> Callable:
    react_agent = maybe_react_agent(
        llm, build_accommodation_tools(client), PROMPT, use_llm
    )

    def accommodation_node(state: TripState) -> dict[str, Any]:
        started = time.perf_counter()
        ctx = TripContext.model_validate(state.get("trip_context") or {})
        dest_id = ctx.destination_id
        if not dest_id:
            return {
                "agent_results": {"accommodation": {"status": "error", "results": []}},
                "errors": [
                    {"agent": "accommodation", "message": "Missing destination_id"}
                ],
                "progress": [make_progress("Searching hotels", "error")],
            }
        hotels = client.search_hotels(
            destination_id=dest_id,
            guests=ctx.guests,
            check_in=ctx.check_in,
            check_out=ctx.check_out,
        )
        rows = [h.model_dump() for h in hotels]
        return {
            "agent_results": {
                "accommodation": {
                    "status": "success" if rows else "empty",
                    "results": rows,
                }
            },
            "progress": [make_progress("Searching hotels")],
            "events": [
                make_event(
                    agent="accommodation",
                    task="search",
                    input={"destination_id": dest_id, "guests": ctx.guests},
                    tool_name="search_hotels",
                    result_summary=summarize_inventory(rows),
                    duration_ms=(time.perf_counter() - started) * 1000,
                )
            ],
        }

    accommodation_node.react_agent = react_agent  # type: ignore[attr-defined]
    return accommodation_node
