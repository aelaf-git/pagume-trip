from __future__ import annotations

import time
from typing import Any, Callable

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event, make_progress
from pagume_agents.shared.react import maybe_react_agent
from pagume_agents.shared.results import summarize_inventory
from pagume_agents.state import TripState
from pagume_agents.transport.prompt import PROMPT
from pagume_agents.transport.tools import build_transport_tools


def make_transport_node(
    client: PagumeInventoryClient,
    *,
    llm: Any | None = None,
    use_llm: bool = False,
) -> Callable:
    react_agent = maybe_react_agent(
        llm, build_transport_tools(client), PROMPT, use_llm
    )

    def transport_node(state: TripState) -> dict[str, Any]:
        started = time.perf_counter()
        ctx = TripContext.model_validate(state.get("trip_context") or {})
        dest_id = ctx.destination_id or ""
        if not dest_id:
            return {
                "agent_results": {"transport": {"status": "error", "results": []}},
                "errors": [
                    {"agent": "transport", "message": "Missing destination_id"}
                ],
                "progress": [make_progress("Comparing transportation", "error")],
            }
        vehicles = client.search_transport(destination_id=dest_id, seats=ctx.guests)
        rows = [v.model_dump() for v in vehicles]
        return {
            "agent_results": {
                "transport": {"status": "success" if rows else "empty", "results": rows}
            },
            "progress": [make_progress("Comparing transportation")],
            "events": [
                make_event(
                    agent="transport",
                    task="search",
                    input={"destination_id": dest_id, "seats": ctx.guests},
                    tool_name="search_transport",
                    result_summary=summarize_inventory(rows),
                    duration_ms=(time.perf_counter() - started) * 1000,
                )
            ],
        }

    transport_node.react_agent = react_agent  # type: ignore[attr-defined]
    return transport_node
