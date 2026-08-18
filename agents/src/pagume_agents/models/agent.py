from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

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


class SupervisorParams(BaseModel):
    """Task params for Groq structured output (`additionalProperties: false`)."""

    model_config = ConfigDict(extra="forbid")

    query: str | None = None
    destination_id: str | None = None
    guests: int | None = None
    seats: int | None = None
    check_in: str | None = None
    check_out: str | None = None


class AgentTask(BaseModel):
    model_config = ConfigDict(extra="forbid")

    agent: AgentName
    task: str
    params: SupervisorParams = Field(default_factory=SupervisorParams)


class AgentResponse(BaseModel):
    agent: str
    status: Literal["success", "empty", "error"]
    task: str = ""
    results: list[dict[str, Any]] = Field(default_factory=list)
    error: str | None = None


def _forbid_additional_properties(schema: Any) -> None:
    if isinstance(schema, dict):
        if schema.get("type") == "object" or "properties" in schema:
            schema.setdefault("additionalProperties", False)
        for value in schema.values():
            _forbid_additional_properties(value)
    elif isinstance(schema, list):
        for item in schema:
            _forbid_additional_properties(item)


class SupervisorDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    next_agent: AgentName
    task: str = "search"
    params: SupervisorParams = Field(default_factory=SupervisorParams)
    reasoning: str = ""

    @classmethod
    def model_json_schema(cls, *args: Any, **kwargs: Any) -> dict[str, Any]:
        schema = super().model_json_schema(*args, **kwargs)
        _forbid_additional_properties(schema)
        params = schema.get("properties", {}).get("params")
        if isinstance(params, dict) and "$ref" in params:
            defs = schema.get("$defs") or schema.get("definitions") or {}
            ref_name = params["$ref"].rsplit("/", 1)[-1]
            inlined = dict(defs.get(ref_name) or {})
            inlined["additionalProperties"] = False
            schema["properties"]["params"] = inlined
        return schema
