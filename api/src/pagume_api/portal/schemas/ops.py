from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DocumentMeta(BaseModel):
    doc_type: str
    file_name: str
    file_size: int = 0
    url: Optional[str] = None


class ProviderProfileCreate(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=200)
    category: str
    phone: Optional[str] = None
    address: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    documents: List[DocumentMeta] = Field(default_factory=list)


class ProviderProfileResponse(BaseModel):
    id: int
    user_id: int
    business_name: str
    category: str
    phone: Optional[str] = None
    address: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    status: str
    rejection_reason: Optional[str] = None
    status_note: Optional[str] = None
    registered_at: Optional[datetime] = None
    email: Optional[str] = None
    documents: List[DocumentMeta] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ProviderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(PENDING|VERIFIED|REJECTED|SUSPENDED|DOCS_REQUESTED)$")
    reason: Optional[str] = None


class PortalBookingCreate(BaseModel):
    service_type: str
    service_id: Optional[int] = None
    service_name: str
    customer_name: str
    customer_email: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    dates: Optional[str] = None
    price: float = 0.0


class PortalBookingResponse(BaseModel):
    id: int
    provider_id: int
    service_type: str
    service_id: Optional[int] = None
    service_name: str
    customer_name: str
    customer_email: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    dates: Optional[str] = None
    price: float
    booking_status: str
    payment_status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PortalPaymentResponse(BaseModel):
    id: int
    provider_id: int
    booking_id: Optional[int] = None
    amount: float
    currency: str
    status: str
    method: Optional[str] = None
    reference: Optional[str] = None
    occurred_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PortalReviewResponse(BaseModel):
    id: int
    provider_id: int
    author_name: str
    rating: int
    comment: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ModerationItemResponse(BaseModel):
    id: int
    provider_id: int
    content_type: str
    content_ref_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str
    flag_reason: Optional[str] = None
    provider_name: Optional[str] = None
    category: Optional[str] = None
    uploaded_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ModerationUpdate(BaseModel):
    status: str = Field(..., pattern="^(PENDING_REVIEW|APPROVED|FLAGGED|EDIT_REQUESTED)$")
    flag_reason: Optional[str] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    body: Optional[str] = None
    read: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PlatformSettingResponse(BaseModel):
    key: str
    value: Dict[str, Any] = Field(default_factory=dict)

    model_config = {"from_attributes": True}


class PlatformSettingUpdate(BaseModel):
    value: Dict[str, Any] = Field(default_factory=dict)


class AgentRunLogResponse(BaseModel):
    id: int
    agent: str
    task: Optional[str] = None
    input_params: Dict[str, Any] = Field(default_factory=dict)
    tools_called: List[Any] = Field(default_factory=list)
    tool_results: List[Any] = Field(default_factory=list)
    decisions: List[Any] = Field(default_factory=list)
    duration_ms: Optional[int] = None
    token_usage: Dict[str, Any] = Field(default_factory=dict)
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    users_total: int = 0
    providers_pending: int = 0
    providers_verified: int = 0
    destinations: int = 0
    bookings_total: int = 0
    bookings_pending: int = 0
    payments_total: float = 0.0
    hotels: int = 0
    tours: int = 0
    vehicles: int = 0


class OnboardingStatus(BaseModel):
    status: str
    submitted_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    is_verified: bool = False


class ProviderDashboardStats(BaseModel):
    bookings_total: int = 0
    bookings_pending: int = 0
    bookings_confirmed: int = 0
    revenue: float = 0.0
    reviews_count: int = 0
    average_rating: float = 0.0
