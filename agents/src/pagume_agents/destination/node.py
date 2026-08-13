from __future__ import annotations

import time
from typing import Any, Callable

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.destination.prompt import PROMPT
from pagume_agents.destination.tools import build_destination_tools
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event, make_progress
from pagume_agents.shared.react import maybe_react_agent
from pagume_agents.shared.results import summarize_inventory
from pagume_agents.state import TripState


def make_destination_node(
    client: PagumeInventoryClient,
    *,
    llm: Any | None = None,
    use_llm: bool = False,
) -> Callable:
    react_agent = maybe_react_agent(
        llm, build_destination_tools(client), PROMPT, use_llm
    )

    def destination_node(state: TripState) -> dict[str, Any]:
        started = time.perf_counter()
        ctx = TripContext.model_validate(state.get("trip_context") or {})
        task = state.get("current_task") or {}
        params = task.get("params") or {}
        query = params.get("query") or ctx.destination_query or ""
        rows = [d.model_dump() for d in client.search_destinations(query=query)]
        destination_id = rows[0]["id"] if rows else ctx.destination_id
        destination_name = rows[0]["name"] if rows else ctx.destination_name
        return {
            "trip_context": {
                **ctx.model_dump(),
                "destination_id": destination_id,
                "destination_name": destination_name,
                "destination_query": query or ctx.destination_query,
            },
            "agent_results": {
                "destination": {"status": "success" if rows else "empty", "results": rows}
            },
            "progress": [
                make_progress("Found destination" if rows else "No destination found")
            ],
            "events": [
                make_event(
                    agent="destination",
                    task="search",
                    input={"query": query},
                    tool_name="search_destinations",
                    result_summary=summarize_inventory(rows),
                    duration_ms=(time.perf_counter() - started) * 1000,
                )
            ],
        }

    destination_node.react_agent = react_agent  # type: ignore[attr-defined]
    return destination_node
