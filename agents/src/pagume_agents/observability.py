from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


class AgentEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: uuid4().hex[:12])
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    agent: str
    task: str | None = None
    input: dict[str, Any] = Field(default_factory=dict)
    tool_name: str | None = None
    result_summary: Any = None
    error: str | None = None
    duration_ms: float | None = None
    token_usage: dict[str, int] | None = None


def make_event(**kwargs: Any) -> dict[str, Any]:
    return AgentEvent(**kwargs).model_dump()


def make_progress(label: str, status: str = "done") -> dict[str, str]:
    return {"label": label, "status": status}


class RunEventLog:
    """In-memory per-thread event log (FRS §43). Swap for DB later."""

    def __init__(self) -> None:
        self._runs: dict[str, list[dict[str, Any]]] = {}

    def append(self, thread_id: str, event: dict[str, Any]) -> None:
        self._runs.setdefault(thread_id, []).append(event)

    def list(self, thread_id: str) -> list[dict[str, Any]]:
        return list(self._runs.get(thread_id, []))

    def extend(self, thread_id: str, events: list[dict[str, Any]]) -> None:
        self._runs.setdefault(thread_id, []).extend(events)

    def clear(self, thread_id: str) -> None:
        self._runs.pop(thread_id, None)
