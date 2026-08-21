from __future__ import annotations

import time
from typing import Any

from pagume_agents.models.inventory import Hotel, TourPackage, Vehicle
from pagume_agents.models.trip import TripContext
from pagume_agents.observability import make_event, make_progress
from pagume_agents.planning import generate_trip_options
from pagume_agents.state import TripState


def _load_models(rows: list[dict], model):
    return [model.model_validate(row) for row in rows]


def budget_node(state: TripState) -> dict[str, Any]:
    started = time.perf_counter()
    ctx = TripContext.model_validate(state.get("trip_context") or {})
    results = state.get("agent_results") or {}

    hotels = _load_models((results.get("accommodation") or {}).get("results") or [], Hotel)
    vehicles = _load_models((results.get("transport") or {}).get("results") or [], Vehicle)
    if not vehicles:
        vehicles = _load_models(
            (results.get("car_rental") or {}).get("results") or [], Vehicle
        )
    tours = _load_models((results.get("tour") or {}).get("results") or [], TourPackage)

    options = generate_trip_options(hotels, vehicles, tours, ctx)
    dumped = [opt.model_dump() for opt in options]
    in_budget = [opt for opt in dumped if not opt["over_budget"]]
    selected = (in_budget or dumped)[:1]
    selected_option = selected[0] if selected else None
    violations = [opt for opt in dumped if opt["over_budget"]]

    return {
        "proposed_options": dumped,
        "selected_option": selected_option,
        "agent_results": {
            "budget": {
                "status": "success" if dumped else "empty",
                "results": dumped,
                "violations": violations,
                "budget_etb": ctx.budget_etb,
            }
        },
        "progress": [make_progress("Calculating budget")],
        "events": [
            make_event(
                agent="budget",
                task="calculate",
                input={"budget_etb": ctx.budget_etb, "combinations": len(dumped)},
                result_summary={
                    "option_count": len(dumped),
                    "in_budget": len(in_budget),
                    "selected_total": selected_option["total_etb"] if selected_option else None,
                },
                duration_ms=(time.perf_counter() - started) * 1000,
            )
        ],
    }
