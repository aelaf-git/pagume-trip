from enum import StrEnum

from pydantic import BaseModel, Field


class BookingStatus(StrEnum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    AUTHORIZED = "AUTHORIZED"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"
    REFUNDED = "REFUNDED"


class BookingItem(BaseModel):
    service_type: str
    entity_id: str
    name: str
    price_etb: float
    currency: str = "ETB"
    room_id: str | None = None
    check_in: str | None = None
    check_out: str | None = None


class Booking(BaseModel):
    id: str
    user_id: str | None = None
    provider_id: str | None = None
    items: list[BookingItem] = Field(default_factory=list)
    price_etb: float
    currency: str = "ETB"
    status: BookingStatus = BookingStatus.DRAFT
    payment_status: str = "UNPAID"
    confirmation_code: str | None = None
    idempotency_key: str | None = None
    cancellation_policy: str = ""
