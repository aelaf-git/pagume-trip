from __future__ import annotations

from typing import Any, Callable

from langchain_core.messages import HumanMessage, SystemMessage

from pagume_agents.extract import extract_trip_context, wants_booking
from pagume_agents.models.agent import SupervisorDecision
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event
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


def pipeline_decision(state: TripState) -> SupervisorDecision:
    ctx = TripContext.model_validate(state.get("trip_context") or {})
    results = state.get("agent_results") or {}
    text = _latest_user_text(state)

    if wants_booking(text) and results.get("itinerary") and not results.get("booking"):
        return SupervisorDecision(next_agent="booking", task="confirm", params={})

    if not results.get("destination"):
        return SupervisorDecision(
            next_agent="destination",
            task="search",
            params={"query": ctx.destination_query or text},
        )
    if ctx.wants_hotel and not results.get("accommodation"):
        return SupervisorDecision(
            next_agent="accommodation",
            task="search",
            params={
                "destination_id": ctx.destination_id,
                "guests": ctx.guests,
                "check_in": ctx.check_in,
                "check_out": ctx.check_out,
            },
        )
    if ctx.wants_car_rental and not results.get("car_rental"):
        return SupervisorDecision(
            next_agent="car_rental",
            task="search",
            params={"destination_id": ctx.destination_id, "seats": ctx.guests},
        )
    if ctx.wants_transport and not results.get("transport"):
        return SupervisorDecision(
            next_agent="transport",
            task="search",
            params={"destination_id": ctx.destination_id, "seats": ctx.guests},
        )
    if ctx.wants_tour and not results.get("tour"):
        return SupervisorDecision(
            next_agent="tour",
            task="search",
            params={
                "destination_id": ctx.destination_id,
                "query": ctx.tour_query,
                "guests": ctx.guests,
            },
        )
    if not results.get("budget"):
        return SupervisorDecision(next_agent="budget", task="calculate", params={})
    if not results.get("itinerary"):
        return SupervisorDecision(next_agent="itinerary", task="build", params={})
    return SupervisorDecision(next_agent="respond", task="present", params={})


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

        decision = pipeline_decision({**state, "trip_context": context.model_dump()})
        if structured is not None:
            try:
                llm_decision = structured.invoke(
                    [
                        SystemMessage(content=SUPERVISOR_SYSTEM),
                        HumanMessage(
                            content=(
                                f"User message: {text}\n"
                                f"Trip context: {context.model_dump_json()}\n"
                                f"Agent results keys: {list((state.get('agent_results') or {}).keys())}\n"
                                f"Proposed pipeline next: {decision.model_dump_json()}"
                            )
                        ),
                    ]
                )
                if isinstance(llm_decision, SupervisorDecision):
                    decision = llm_decision
            except Exception as exc:  # noqa: BLE001 — fall back to pipeline
                decision = pipeline_decision({**state, "trip_context": context.model_dump()})
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
                    input={"next_agent": decision.next_agent, "params": decision.params},
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
