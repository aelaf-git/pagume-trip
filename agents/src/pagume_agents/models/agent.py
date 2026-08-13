from typing import Any, Literal

from pydantic import BaseModel, Field

AgentName = Literal[
    "destination",
    "accommodation",
    "transport",
    "car_rental",
    "tour",
    "budget",
    "itinerary",
    "booking",
    "respond",
]


class AgentTask(BaseModel):
    agent: AgentName
    task: str
    params: dict[str, Any] = Field(default_factory=dict)


class AgentResponse(BaseModel):
    agent: str
    status: Literal["success", "empty", "error"]
    task: str = ""
    results: list[dict[str, Any]] = Field(default_factory=list)
    error: str | None = None


class SupervisorDecision(BaseModel):
    next_agent: AgentName
    task: str = "search"
    params: dict[str, Any] = Field(default_factory=dict)
    reasoning: str = ""
