from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UserPreferences(BaseModel):
    user_id: str
    preferred_accommodation_type: str | None = None
    preferred_transportation: str | None = None
    budget_range_etb: tuple[float, float] | None = None
    travel_interests: list[str] = Field(default_factory=list)
    preferred_destinations: list[str] = Field(default_factory=list)
    dietary_preferences: list[str] = Field(default_factory=list)


class TripContext(BaseModel):
    destination_query: str | None = None
    destination_id: str | None = None
    destination_name: str | None = None
    check_in: str | None = None
    check_out: str | None = None
    duration_days: int | None = None
    guests: int | None = None
    budget_etb: float | None = None
    preferences: list[str] = Field(default_factory=list)
    wants_hotel: bool = False
    wants_transport: bool = False
    wants_tour: bool = False
    wants_car_rental: bool = False
    tour_query: str | None = None
    browse_destinations: bool = False
    wants_circuit: bool = False
    user_id: str | None = None

    @property
    def nights(self) -> int:
        if self.duration_days is None:
            return 1
        return max(self.duration_days, 1)


class TripContextPatch(BaseModel):
    """LLM slot-fill. Null means this message did not mention the field."""

    model_config = ConfigDict(extra="forbid")

    destination_query: str | None = None
    check_in: str | None = None
    check_out: str | None = None
    duration_days: int | None = None
    guests: int | None = None
    budget_etb: float | None = None
    wants_hotel: bool | None = None
    wants_transport: bool | None = None
    wants_tour: bool | None = None
    wants_car_rental: bool | None = None
    tour_query: str | None = None
    browse_destinations: bool | None = None
    wants_circuit: bool | None = None
    preferences: list[str] | None = None

    @classmethod
    def model_json_schema(cls, *args: Any, **kwargs: Any) -> dict[str, Any]:
        schema = super().model_json_schema(*args, **kwargs)
        if isinstance(schema, dict) and (schema.get("type") == "object" or "properties" in schema):
            schema.setdefault("additionalProperties", False)
        return schema


class ItineraryItem(BaseModel):
    day: int
    time: str | None = None
    title: str
    description: str = ""
    entity_type: str | None = None
    entity_id: str | None = None


class TripOptionItem(BaseModel):
    kind: str
    entity_id: str
    name: str
    cost_etb: float
    extra: dict = Field(default_factory=dict)


class TripOption(BaseModel):
    option_id: str
    label: str
    items: list[TripOptionItem] = Field(default_factory=list)
    total_etb: float
    currency: str = "ETB"
    over_budget: bool = False


class Trip(BaseModel):
    id: str
    user_id: str | None = None
    destination_id: str | None = None
    status: str = "DRAFT"
    option: TripOption | None = None
    itinerary: list[ItineraryItem] = Field(default_factory=list)
    booking_ids: list[str] = Field(default_factory=list)
    total_etb: float = 0
    currency: str = "ETB"
