from __future__ import annotations

from typing import Annotated, Any, TypedDict

from langgraph.graph.message import add_messages


def merge_dicts(left: dict[str, Any] | None, right: dict[str, Any] | None) -> dict[str, Any]:
    """Shallow-merge maps. A right-hand `None` value deletes the key (stale specialist results)."""
    merged = {**(left or {}), **(right or {})}
    return {key: value for key, value in merged.items() if value is not None}


def add_lists(left: list | None, right: list | None) -> list:
    return (left or []) + (right or [])


class TripState(TypedDict, total=False):
    messages: Annotated[list, add_messages]
    trip_context: dict[str, Any]
    task_queue: list[dict[str, Any]]
    current_task: dict[str, Any] | None
    agent_results: Annotated[dict[str, Any], merge_dicts]
    proposed_options: list[dict[str, Any]]
    selected_option: dict[str, Any] | None
    itinerary: list[dict[str, Any]]
    trip: dict[str, Any] | None
    pending_approval: dict[str, Any] | None
    authorization: dict[str, Any]
    progress: Annotated[list[dict[str, Any]], add_lists]
    errors: Annotated[list[dict[str, Any]], add_lists]
    events: Annotated[list[dict[str, Any]], add_lists]
    final_message: str | None
    next_agent: str | None
    user_message: str
