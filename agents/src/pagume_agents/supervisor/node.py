from __future__ import annotations

from typing import Any, Callable

from langchain_core.messages import HumanMessage, SystemMessage

from pagume_agents.extract import is_trip_intent, resolve_trip_context, wants_booking
from pagume_agents.models.agent import SupervisorDecision, SupervisorParams
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event
from pagume_agents.shared.conversation import format_transcript
from pagume_agents.shared.results import summarize_inventory
from pagume_agents.state import TripState
from pagume_agents.supervisor.prompt import SUPERVISOR_SYSTEM

_DOWNSTREAM = {
    "accommodation",
    "transport",
    "car_rental",
    "tour",
    "budget",
    "itinerary",
    "booking",
}


def _latest_user_text(state: TripState) -> str:
    if state.get("user_message"):
        return str(state["user_message"])
    for message in reversed(state.get("messages") or []):
        content = getattr(message, "content", None)
        type_ = getattr(message, "type", None) or getattr(message, "role", None)
        if type_ in ("human", "user") and content:
            return str(content)
    return ""


def stale_specialist_keys(
    existing: TripContext | None,
    context: TripContext,
    results: dict[str, Any],
) -> set[str]:
    """Specialist results that no longer match the updated session context."""
    stale: set[str] = set()
    dest = results.get("destination")
    dest_changed = False
    if dest and context.destination_query and not context.browse_destinations:
        if context.destination_id and context.destination_name:
            query = context.destination_query.lower()
            name = context.destination_name.lower()
            if query not in name and name not in query:
                dest_changed = True
        elif existing and existing.browse_destinations and not context.browse_destinations:
            dest_changed = True
    if dest_changed:
        stale.add("destination")
        stale.update(key for key in _DOWNSTREAM if key in results)

    if existing and context.destination_id:
        planning_changed = (
            context.guests != existing.guests
            or context.budget_etb != existing.budget_etb
            or context.check_in != existing.check_in
            or context.check_out != existing.check_out
            or context.duration_days != existing.duration_days
        )
        if planning_changed:
            stale.update(key for key in _DOWNSTREAM if key in results)
    return stale


def _supervisor_user_payload(
    text: str,
    context: TripContext,
    results: dict[str, Any],
    conversation: str = "",
) -> str:
    """Compact briefing for Groq — flags and names, not a prescribed hop."""
    specialists: list[str] = []
    for name, payload in (results or {}).items():
        status = (payload or {}).get("status") or "unknown"
        names = [
            item.get("name")
            for item in summarize_inventory((payload or {}).get("results") or [])[:3]
            if item.get("name")
        ]
        line = f"- {name}: {status}"
        if names:
            line += f" ({', '.join(names)})"
        specialists.append(line)
    specialist_block = "\n".join(specialists) if specialists else "- none yet"
    return (
        f"Conversation so far:\n{conversation or '(no prior turns)'}\n"
        f"Latest user message: {text}\n"
        f"browse_destinations: {context.browse_destinations}\n"
        f"wants_circuit: {context.wants_circuit}\n"
        f"destination_id: {context.destination_id}\n"
        f"destination_name: {context.destination_name}\n"
        f"destination_query: {context.destination_query}\n"
        f"guests: {context.guests}\n"
        f"budget_etb: {context.budget_etb}\n"
        f"duration_days: {context.duration_days}\n"
        f"wants_hotel: {context.wants_hotel}\n"
        f"wants_transport: {context.wants_transport}\n"
        f"wants_car_rental: {context.wants_car_rental}\n"
        f"wants_tour: {context.wants_tour}\n"
        f"Specialists already run:\n{specialist_block}\n"
        "Return one SupervisorDecision for the single next hop. "
        "Run only agents needed to answer this message. Respond when you can answer."
    )


def _has_pricable_inventory(results: dict[str, Any]) -> bool:
    for key in ("accommodation", "transport", "car_rental", "tour"):
        if (results.get(key) or {}).get("results"):
            return True
    return False


def fallback_decision(state: TripState) -> SupervisorDecision:
    """Intent-based hop when Groq is off or the LLM call fails. Not a fixed ladder."""
    ctx = TripContext.model_validate(state.get("trip_context") or {})
    results = state.get("agent_results") or {}
    text = _latest_user_text(state)

    if wants_booking(text) and results.get("itinerary") and not results.get("booking"):
        return SupervisorDecision(next_agent="booking", task="confirm")

    if not is_trip_intent(text, ctx):
        return SupervisorDecision(next_agent="respond", task="present")

    if not results.get("destination"):
        # Never pass the raw user sentence as q= — it matches no place names.
        # Empty query lists the verified catalog (browse / open-ended "plan a trip").
        query = "" if ctx.browse_destinations else (ctx.destination_query or "")
        return SupervisorDecision(
            next_agent="destination",
            task="search",
            params=SupervisorParams(query=query),
        )
    if not ctx.destination_id:
        # Catalog listed, or they asked to visit every listed place — talk, don't search.
        return SupervisorDecision(next_agent="respond", task="present")
    if ctx.wants_hotel and not results.get("accommodation"):
        return SupervisorDecision(
            next_agent="accommodation",
            task="search",
            params=SupervisorParams(
                destination_id=ctx.destination_id,
                guests=ctx.guests,
                check_in=ctx.check_in,
                check_out=ctx.check_out,
            ),
        )
    if ctx.wants_car_rental and not results.get("car_rental"):
        return SupervisorDecision(
            next_agent="car_rental",
            task="search",
            params=SupervisorParams(destination_id=ctx.destination_id, seats=ctx.guests),
        )
    if ctx.wants_transport and not results.get("transport"):
        return SupervisorDecision(
            next_agent="transport",
            task="search",
            params=SupervisorParams(destination_id=ctx.destination_id, seats=ctx.guests),
        )
    if ctx.wants_tour and not results.get("tour"):
        return SupervisorDecision(
            next_agent="tour",
            task="search",
            params=SupervisorParams(
                destination_id=ctx.destination_id,
                query=ctx.tour_query,
                guests=ctx.guests,
            ),
        )
    if _has_pricable_inventory(results) and (ctx.budget_etb is not None or ctx.duration_days) and not results.get("budget"):
        return SupervisorDecision(next_agent="budget", task="calculate")
    if ctx.duration_days and results.get("budget") and not results.get("itinerary"):
        return SupervisorDecision(next_agent="itinerary", task="build")
    return SupervisorDecision(next_agent="respond", task="present")


pipeline_decision = fallback_decision


def _apply_supervisor_guardrails(
    decision: SupervisorDecision, state: TripState
) -> SupervisorDecision:
    """Block unsafe or looping hops. Do not force unused specialists."""
    results = state.get("agent_results") or {}
    ctx = TripContext.model_validate(state.get("trip_context") or {})
    text = _latest_user_text(state)

    if not is_trip_intent(text, ctx):
        return SupervisorDecision(next_agent="respond", task="present")

    if decision.next_agent == "respond":
        return decision

    if results.get("destination") and not ctx.destination_id and decision.next_agent == "destination":
        return SupervisorDecision(next_agent="respond", task="present")

    needs_place = {
        "accommodation",
        "transport",
        "car_rental",
        "tour",
        "budget",
        "itinerary",
    }
    if not ctx.destination_id and decision.next_agent in needs_place:
        return fallback_decision(state)

    if decision.next_agent in results and decision.next_agent not in {"respond", "booking"}:
        return fallback_decision(state)

    return decision


def make_supervisor_node(llm: Any | None = None, use_llm: bool = False) -> Callable:
    structured = None
    if use_llm and llm is not None:
        structured = llm.with_structured_output(SupervisorDecision)

    def supervisor_node(state: TripState) -> dict[str, Any]:
        text = _latest_user_text(state)
        existing = None
        if state.get("trip_context"):
            existing = TripContext.model_validate(state["trip_context"])
        conversation = format_transcript(state.get("messages"))
        context = resolve_trip_context(
            text,
            existing,
            llm=llm if use_llm else None,
            conversation=conversation,
        )
        raw_results = state.get("agent_results") or {}
        stale = stale_specialist_keys(existing, context, raw_results)
        live_results = {key: value for key, value in raw_results.items() if key not in stale}
        merged = {
            **state,
            "trip_context": context.model_dump(),
            "agent_results": live_results,
        }

        def _update(decision: SupervisorDecision, **extra: Any) -> dict[str, Any]:
            payload: dict[str, Any] = {
                "trip_context": context.model_dump(),
                "current_task": decision.model_dump(),
                "next_agent": decision.next_agent,
                "events": extra.pop("events"),
            }
            if stale:
                payload["agent_results"] = {key: None for key in stale}
                payload["selected_option"] = None
                payload["proposed_options"] = []
                payload["itinerary"] = []
            payload.update(extra)
            return payload

        decision = fallback_decision(merged)
        if structured is not None:
            try:
                llm_decision = structured.invoke(
                    [
                        SystemMessage(content=SUPERVISOR_SYSTEM),
                        HumanMessage(
                            content=_supervisor_user_payload(
                                text,
                                context,
                                live_results,
                                conversation=conversation,
                            )
                        ),
                    ]
                )
                if isinstance(llm_decision, SupervisorDecision):
                    decision = _apply_supervisor_guardrails(llm_decision, merged)
            except Exception as exc:  # noqa: BLE001 — fall back to intent heuristic
                decision = fallback_decision(merged)
                return _update(
                    decision,
                    errors=[
                        {
                            "agent": "supervisor",
                            "message": f"LLM supervisor failed; using fallback. {exc}",
                        }
                    ],
                    events=[
                        make_event(
                            agent="supervisor",
                            task=decision.task,
                            input={"next_agent": decision.next_agent},
                            error=str(exc),
                        )
                    ],
                )

        return _update(
            decision,
            events=[
                make_event(
                    agent="supervisor",
                    task=decision.task,
                    input={
                        "next_agent": decision.next_agent,
                        "params": decision.params.model_dump(),
                        "reasoning": decision.reasoning,
                    },
                )
            ],
        )

    return supervisor_node


def route_from_supervisor(state: TripState) -> str:
    nxt = state.get("next_agent") or "respond"
    allowed = {
        "destination",
        "accommodation",
        "transport",
        "car_rental",
        "tour",
        "budget",
        "itinerary",
        "booking",
        "respond",
    }
    return nxt if nxt in allowed else "respond"
