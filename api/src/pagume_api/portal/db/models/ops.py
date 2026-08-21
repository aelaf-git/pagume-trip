"""Portal persistence models: profiles, bookings, payments, moderation, etc."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from pagume_api.portal.db.base_class import Base


class ProviderProfile(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), unique=True, nullable=False)
    business_name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # hotel | agency | transport | driver
    phone = Column(String)
    address = Column(String)
    details = Column(JSON, default=dict)
    status = Column(String, default="PENDING")  # PENDING|VERIFIED|REJECTED|SUSPENDED|DOCS_REQUESTED
    rejection_reason = Column(Text)
    status_note = Column(Text)
    registered_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])


class ProviderDocument(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    doc_type = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    url = Column(String)

    user = relationship("User", foreign_keys=[user_id])


class PortalBooking(Base):
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    service_type = Column(String, nullable=False)  # hotel|room|tour|vehicle|driver
    service_id = Column(Integer)
    service_name = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    dates = Column(String)  # display string
    price = Column(Float, default=0.0)
    booking_status = Column(String, default="PENDING")  # PENDING|CONFIRMED|CANCELLED
    payment_status = Column(String, default="UNPAID")  # UNPAID|PAID|REFUNDED
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("User", foreign_keys=[provider_id])


class PortalPayment(Base):
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("portalbooking.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="ETB")
    status = Column(String, default="PENDING")  # PENDING|COMPLETED|FAILED|REFUNDED
    method = Column(String)
    reference = Column(String)
    occurred_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("User", foreign_keys=[provider_id])


class PortalReview(Base):
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    author_name = Column(String, nullable=False)
    rating = Column(Integer, default=5)
    comment = Column(Text)
    status = Column(String, default="VISIBLE")  # VISIBLE|HIDDEN
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("User", foreign_keys=[provider_id])


class ModerationItem(Base):
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    content_type = Column(String, nullable=False)  # hotel|tour|vehicle|driver|destination
    content_ref_id = Column(Integer)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="PENDING_REVIEW")  # PENDING_REVIEW|APPROVED|FLAGGED|EDIT_REQUESTED
    flag_reason = Column(Text)
    provider_name = Column(String)
    category = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("User", foreign_keys=[provider_id])


class Notification(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    body = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])


class PlatformSetting(Base):
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(JSON, default=dict)


class AgentRunLog(Base):
    id = Column(Integer, primary_key=True, index=True)
    agent = Column(String, nullable=False)
    task = Column(String)
    input_params = Column(JSON, default=dict)
    tools_called = Column(JSON, default=list)
    tool_results = Column(JSON, default=list)
    decisions = Column(JSON, default=list)
    duration_ms = Column(Integer)
    token_usage = Column(JSON, default=dict)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)
