from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage

from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event, make_progress
from pagume_agents.state import TripState

UNAVAILABLE = (
    "I couldn't find a verified match for that requirement in Pagume's current inventory."
)


def _names_from(results: dict, key: str) -> list[str]:
    rows = (results.get(key) or {}).get("results") or []
    return [row.get("name") for row in rows if row.get("name")]


def respond_node(state: TripState) -> dict[str, Any]:
    ctx = TripContext.model_validate(state.get("trip_context") or {})
    results = state.get("agent_results") or {}
    option = state.get("selected_option")
    itinerary = state.get("itinerary") or []
    errors = state.get("errors") or []

    dest_rows = (results.get("destination") or {}).get("results") or []
    dest_empty = not dest_rows
    inventory_empty = dest_empty and not (
        (results.get("accommodation") or {}).get("results")
        or (results.get("transport") or {}).get("results")
        or (results.get("tour") or {}).get("results")
    )

    if dest_empty:
        message = UNAVAILABLE
        return {
            "final_message": message,
            "messages": [AIMessage(content=message)],
            "progress": [make_progress("Your trip could not be completed")],
            "events": [make_event(agent="respond", task="present", result_summary={"empty": True})],
        }

    dest_name = ctx.destination_name or dest_rows[0].get("name")
    if option:
        lines = [
            f"I found a complete {ctx.duration_days or ''}-day {dest_name} trip "
            f"for approximately {int(option['total_etb']):,} ETB.".replace("  ", " ")
        ]
        for item in option.get("items", []):
            lines.append(
                f"- {item['kind'].title()}: {item['name']} ({int(item['cost_etb']):,} ETB)"
            )
        if option.get("over_budget"):
            lines.append(
                f"This option exceeds the stated budget of {int(ctx.budget_etb or 0):,} ETB."
            )
        if itinerary:
            lines.append("Itinerary:")
            for entry in itinerary:
                lines.append(f"  Day {entry['day']}: {entry['title']}")
        lines.append("Reply with Book Trip to reserve these verified services, or ask to modify.")
        message = "\n".join(lines)
    else:
        hotels = _names_from(results, "accommodation")
        tours = _names_from(results, "tour")
        vehicles = _names_from(results, "transport") or _names_from(results, "car_rental")
        parts = [f"Here is what Pagume currently has for {dest_name}:"]
        if hotels:
            parts.append("Hotels: " + ", ".join(hotels))
        if vehicles:
            parts.append("Transport: " + ", ".join(vehicles))
        if tours:
            parts.append("Tours: " + ", ".join(tours))
        if inventory_empty:
            parts = [UNAVAILABLE]
        message = "\n".join(parts)

    if errors and not option:
        message += "\nSome agents reported issues; no unverified inventory was added."

    return {
        "final_message": message,
        "messages": [AIMessage(content=message)],
        "progress": [make_progress("Your trip is ready")],
        "events": [
            make_event(
                agent="respond",
                task="present",
                result_summary={
                    "destination_id": ctx.destination_id,
                    "option_id": option.get("option_id") if option else None,
                },
            )
        ],
    }
