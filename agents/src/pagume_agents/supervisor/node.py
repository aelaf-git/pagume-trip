from __future__ import annotations

from typing import Any, Callable

from langchain_core.messages import HumanMessage, SystemMessage

from pagume_agents.extract import extract_trip_context, wants_booking
from pagume_agents.models.agent import SupervisorDecision, SupervisorParams
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event
from pagume_agents.shared.results import summarize_inventory
from pagume_agents.state import TripState
from pagume_agents.supervisor.prompt import SUPERVISOR_SYSTEM


def _latest_user_text(state: TripState) -> str:
    if state.get("user_message"):
        return str(state["user_message"])
    for message in reversed(state.get("messages") or []):
        content = getattr(message, "content", None)
        type_ = getattr(message, "type", None) or getattr(message, "role", None)
        if type_ in ("human", "user") and content:
            return str(content)
    return ""


def _supervisor_user_payload(
    text: str,
    context: TripContext,
    results: dict[str, Any],
    proposed: SupervisorDecision,
) -> str:
    """Compact briefing for Groq — flags and names, not full inventory blobs."""
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
        f"User message: {text}\n"
        f"browse_destinations: {context.browse_destinations}\n"
        f"destination_id: {context.destination_id}\n"
        f"destination_name: {context.destination_name}\n"
        f"destination_query: {context.destination_query}\n"
        f"guests: {context.guests}\n"
        f"budget_etb: {context.budget_etb}\n"
        f"wants_hotel: {context.wants_hotel}\n"
        f"wants_transport: {context.wants_transport}\n"
        f"wants_car_rental: {context.wants_car_rental}\n"
        f"wants_tour: {context.wants_tour}\n"
        f"Specialists already run:\n{specialist_block}\n"
        f"Proposed pipeline: {proposed.model_dump_json()}\n"
        "Return one SupervisorDecision. Prefer the proposed pipeline unless user intent clearly differs."
    )


def pipeline_decision(state: TripState) -> SupervisorDecision:
    ctx = TripContext.model_validate(state.get("trip_context") or {})
    results = state.get("agent_results") or {}
    text = _latest_user_text(state)

    if wants_booking(text) and results.get("itinerary") and not results.get("booking"):
        return SupervisorDecision(next_agent="booking", task="confirm")

    if not results.get("destination"):
        query = "" if ctx.browse_destinations else (ctx.destination_query or text)
        return SupervisorDecision(
            next_agent="destination",
            task="search",
            params=SupervisorParams(query=query),
        )
    if not ctx.destination_id:
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
    if not results.get("budget"):
        return SupervisorDecision(next_agent="budget", task="calculate")
    if not results.get("itinerary"):
        return SupervisorDecision(next_agent="itinerary", task="build")
    return SupervisorDecision(next_agent="respond", task="present")


def _apply_supervisor_guardrails(
    decision: SupervisorDecision, state: TripState
) -> SupervisorDecision:
    """Keep LLM routing from re-dispatching completed work or looping."""
    pipeline = pipeline_decision(state)
    results = state.get("agent_results") or {}
    ctx = TripContext.model_validate(state.get("trip_context") or {})

    if pipeline.next_agent == "respond" and decision.next_agent == "destination":
        return pipeline

    if results.get("destination") and not ctx.destination_id:
        return SupervisorDecision(next_agent="respond", task="present")

    if decision.next_agent == "destination" and results.get("destination"):
        return pipeline

    if not ctx.destination_id and decision.next_agent in {
        "accommodation",
        "transport",
        "car_rental",
        "tour",
        "budget",
        "itinerary",
    }:
        return pipeline

    if decision.next_agent in results and decision.next_agent not in {"respond", "booking"}:
        return pipeline

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
        context = extract_trip_context(text, existing)
        merged = {**state, "trip_context": context.model_dump()}

        decision = pipeline_decision(merged)
        if structured is not None:
            try:
                llm_decision = structured.invoke(
                    [
                        SystemMessage(content=SUPERVISOR_SYSTEM),
                        HumanMessage(
                            content=_supervisor_user_payload(
                                text,
                                context,
                                state.get("agent_results") or {},
                                decision,
                            )
                        ),
                    ]
                )
                if isinstance(llm_decision, SupervisorDecision):
                    decision = _apply_supervisor_guardrails(llm_decision, merged)
            except Exception as exc:  # noqa: BLE001 — fall back to pipeline
                decision = pipeline_decision(merged)
                return {
                    "trip_context": context.model_dump(),
                    "current_task": decision.model_dump(),
                    "next_agent": decision.next_agent,
                    "errors": [
                        {
                            "agent": "supervisor",
                            "message": f"LLM supervisor failed; using pipeline. {exc}",
                        }
                    ],
                    "events": [
                        make_event(
                            agent="supervisor",
                            task=decision.task,
                            input={"next_agent": decision.next_agent},
                            error=str(exc),
                        )
                    ],
                }

        return {
            "trip_context": context.model_dump(),
            "current_task": decision.model_dump(),
            "next_agent": decision.next_agent,
            "events": [
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
        }

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
