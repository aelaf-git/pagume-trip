from __future__ import annotations

from typing import Any, Callable

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from pagume_agents.extract import is_trip_intent
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event, make_progress
from pagume_agents.respond.prompt import CHITCHAT_FALLBACK, RESPOND_SYSTEM
from pagume_agents.shared.conversation import format_transcript, human_message_count
from pagume_agents.state import TripState

UNAVAILABLE = (
    "I couldn't find a verified match for that requirement in Pagume's current inventory."
)


def _names_from(results: dict, key: str) -> list[str]:
    rows = (results.get(key) or {}).get("results") or []
    return [row.get("name") for row in rows if row.get("name")]


def _destination_catalog_message(dest_rows: list[dict[str, Any]]) -> str:
    lines = ["Pagume currently has these verified places in Ethiopia:"]
    for row in dest_rows:
        name = row.get("name")
        if not name:
            continue
        description = (row.get("description") or "").strip()
        if description:
            summary = description.split(".")[0].strip()
            lines.append(f"- {name}: {summary}.")
        else:
            lines.append(f"- {name}")
    lines.append("Tell me which place you want to visit, and I can plan hotels, transport, and tours.")
    return "\n".join(lines)


def _latest_user_text(state: TripState) -> str:
    if state.get("user_message"):
        return str(state["user_message"])
    for message in reversed(state.get("messages") or []):
        content = getattr(message, "content", None)
        type_ = getattr(message, "type", None) or getattr(message, "role", None)
        if type_ in ("human", "user") and content:
            return str(content)
    return ""


def _build_respond_user_payload(
    ctx: TripContext,
    results: dict[str, Any],
    option: dict[str, Any] | None,
    itinerary: list[dict[str, Any]],
    conversation: str = "",
    latest_user_message: str = "",
) -> str:
    dest_name = ctx.destination_name or "the destination"
    hotels = _names_from(results, "accommodation")
    transport = _names_from(results, "transport") or _names_from(results, "car_rental")
    tours = _names_from(results, "tour")

    inventory_lines: list[str] = []
    if hotels:
        inventory_lines.append("Hotels: " + ", ".join(hotels))
    if transport:
        inventory_lines.append("Transport: " + ", ".join(transport))
    if tours:
        inventory_lines.append("Tours: " + ", ".join(tours))
    dest_rows = (results.get("destination") or {}).get("results") or []
    dest_names = [row.get("name") for row in dest_rows if row.get("name")]
    if dest_names and not ctx.destination_id:
        inventory_lines.insert(0, "Places: " + ", ".join(dest_names))
    inventory_summary = "\n".join(inventory_lines) if inventory_lines else "(none found)"

    option_block = ""
    if option:
        items = option.get("items") or []
        item_lines = [
            f"  - {i['kind'].title()}: {i['name']} ({int(i['cost_etb']):,} ETB)"
            for i in items
        ]
        option_block = (
            f"trip_option:\n"
            f"  total_etb: {int(option['total_etb']):,}\n"
            f"  over_budget: {option.get('over_budget', False)}\n"
            + "\n".join(item_lines)
        )
        if itinerary:
            day_lines = [f"  Day {e['day']}: {e['title']}" for e in itinerary]
            option_block += "\nitinerary:\n" + "\n".join(day_lines)

    missing: list[str] = []
    if not ctx.check_in or not ctx.check_out:
        missing.append("travel dates (check-in / check-out)")
    if not ctx.guests:
        missing.append("number of guests")
    if not ctx.budget_etb:
        missing.append("budget")

    return (
        f"latest_user_message: {latest_user_message or '(none)'}\n"
        f"conversation:\n{conversation or '(no prior turns)'}\n"
        f"destination: {dest_name}\n"
        f"duration_days: {ctx.duration_days or 'unknown'}\n"
        f"guests: {ctx.guests or 'unknown'}\n"
        f"budget_etb: {ctx.budget_etb or 'unknown'}\n"
        f"inventory_summary:\n{inventory_summary}\n"
        + (option_block + "\n" if option_block else "")
        + f"missing_fields: {', '.join(missing) or 'none'}"
    )


def _template_fallback(
    ctx: TripContext,
    results: dict[str, Any],
    option: dict[str, Any] | None,
    itinerary: list[dict[str, Any]],
    errors: list[dict[str, Any]],
    dest_rows: list[dict[str, Any]],
) -> str:
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
        inventory_empty = not hotels and not vehicles and not tours
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

    if errors and not option and ctx.destination_id:
        message += "\nSome agents reported issues; no unverified inventory was added."
    return message


def make_respond_node(llm: Any | None = None) -> Callable:
    def respond_node(state: TripState) -> dict[str, Any]:
        ctx = TripContext.model_validate(state.get("trip_context") or {})
        results = state.get("agent_results") or {}
        option = state.get("selected_option")
        itinerary = state.get("itinerary") or []
        errors = state.get("errors") or []

        dest_rows = (results.get("destination") or {}).get("results") or []
        dest_empty = not dest_rows
        conversation = format_transcript(state.get("messages"))
        latest = _latest_user_text(state)

        def _llm_message(fallback: str) -> str:
            if llm is None:
                return fallback
            try:
                payload = _build_respond_user_payload(
                    ctx,
                    results,
                    option,
                    itinerary,
                    conversation=conversation,
                    latest_user_message=latest,
                )
                response = llm.invoke(
                    [
                        SystemMessage(content=RESPOND_SYSTEM),
                        HumanMessage(content=payload),
                    ]
                )
                return response.content if hasattr(response, "content") else str(response)
            except Exception:  # noqa: BLE001
                return fallback

        # Ordinary chat: greet, identity, off-topic — do not treat as a failed search
        if dest_empty and not is_trip_intent(latest, ctx):
            message = _llm_message(CHITCHAT_FALLBACK)
            return {
                "final_message": message,
                "messages": [AIMessage(content=message)],
                "progress": [make_progress("Happy to chat")],
                "events": [
                    make_event(
                        agent="respond",
                        task="present",
                        result_summary={"chitchat": True},
                    )
                ],
            }

        # Fast path: trip asked for, but no destination found
        if dest_empty:
            message = UNAVAILABLE
            return {
                "final_message": message,
                "messages": [AIMessage(content=message)],
                "progress": [make_progress("Your trip could not be completed")],
                "events": [make_event(agent="respond", task="present", result_summary={"empty": True})],
            }

        # Catalog browse: template on the first turn, LLM once the session has history
        if not ctx.destination_id:
            template = _destination_catalog_message(dest_rows)
            use_session_llm = llm is not None and human_message_count(state.get("messages")) > 1
            message = _llm_message(template) if use_session_llm else template
            return {
                "final_message": message,
                "messages": [AIMessage(content=message)],
                "progress": [make_progress("Here are verified places you can visit")],
                "events": [
                    make_event(
                        agent="respond",
                        task="present",
                        result_summary={"catalog": True, "count": len(dest_rows)},
                    )
                ],
            }

        fallback = _template_fallback(ctx, results, option, itinerary, errors, dest_rows)
        message = _llm_message(fallback)

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

    return respond_node
