from __future__ import annotations

import time
from typing import Any, Callable

from pagume_agents.clients.errors import InventoryUnavailableError
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
        if not isinstance(params, dict):
            params = params.model_dump() if hasattr(params, "model_dump") else {}
        if ctx.browse_destinations:
            query = ""
        else:
            raw = params.get("query") or ctx.destination_query or ""
            # LLM sometimes copies the full user sentence into query; that never matches.
            if isinstance(raw, str) and len(raw.split()) > 5 and not ctx.destination_query:
                query = ""
            else:
                query = (ctx.destination_query or raw or "").strip()
        missed_exact = False
        try:
            rows = [d.model_dump() for d in client.search_destinations(query=query)]
            # Unknown place names: offer the full catalog instead of a dead end.
            if not rows and (query or "").strip():
                missed_exact = True
                rows = [d.model_dump() for d in client.search_destinations(query="")]
        except InventoryUnavailableError as exc:
            return {
                "errors": [{"agent": "destination", "message": str(exc)}],
                "agent_results": {
                    "destination": {"status": "error", "results": []}
                },
                "progress": [
                    make_progress("Inventory temporarily unavailable")
                ],
                "final_message": (
                    "I couldn't reach the travel inventory service just now. "
                    "Please make sure the Pagume API is running on port 8000, then try again."
                ),
                "events": [
                    make_event(
                        agent="destination",
                        task="search",
                        input={"query": query},
                        tool_name="search_destinations",
                        error=str(exc),
                        duration_ms=(time.perf_counter() - started) * 1000,
                    )
                ],
            }
        city_requested = bool(ctx.destination_query) and not ctx.browse_destinations
        if rows and not missed_exact and (city_requested or len(rows) == 1):
            destination_id = rows[0]["id"]
            destination_name = rows[0]["name"]
        else:
            destination_id = None if missed_exact else ctx.destination_id
            destination_name = None if missed_exact else ctx.destination_name
        found_label = "Found destination"
        if missed_exact and rows:
            found_label = "No exact match — showing places we cover"
        elif (ctx.browse_destinations or missed_exact) and rows:
            found_label = "Found destinations"
        elif not rows:
            found_label = "No destination found"
        return {
            "trip_context": {
                **ctx.model_dump(),
                "destination_id": destination_id,
                "destination_name": destination_name,
                "browse_destinations": True if missed_exact else ctx.browse_destinations,
                "destination_query": (
                    None
                    if missed_exact
                    else (
                        ctx.destination_query
                        if ctx.browse_destinations
                        else (query or ctx.destination_query)
                    )
                ),
            },
            "agent_results": {
                "destination": {
                    "status": "success" if rows else "empty",
                    "results": rows,
                }
            },
            "progress": [
                make_progress(found_label)
            ],
            "events": [
                make_event(
                    agent="destination",
                    task="search",
                    input={"query": query, "missed_exact": missed_exact},
                    tool_name="search_destinations",
                    result_summary=summarize_inventory(rows),
                    duration_ms=(time.perf_counter() - started) * 1000,
                )
            ],
        }

    destination_node.react_agent = react_agent  # type: ignore[attr-defined]
    return destination_node
