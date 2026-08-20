from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, JSON, DateTime, Enum, Date
from sqlalchemy.orm import relationship
import enum
import datetime
from src.db.base_class import Base

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class BookingItemType(str, enum.Enum):
    ROOM = "ROOM"
    VEHICLE = "VEHICLE"
    TOUR_PACKAGE = "TOUR_PACKAGE"

class Booking(Base):
    id = Column(Integer, primary_key=True, index=True)
    traveler_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    # Polymorphic Association
    item_type = Column(Enum(BookingItemType), nullable=False)
    item_id = Column(Integer, nullable=False)
    
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    total_price = Column(Float, nullable=False)
    
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.UTC))
    special_requests = Column(Text)
    
    # Relationships
    traveler = relationship("User", foreign_keys=[traveler_id])
    provider = relationship("User", foreign_keys=[provider_id])
    payment = relationship("Payment", back_populates="booking", uselist=False)

class Payment(Base):
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("booking.id"), nullable=False, unique=True)
    
    # Financial idempotency
    provider_gateway = Column(String, nullable=False) # e.g., 'CHAPA', 'TELEBIRR', 'STRIPE'
    transaction_reference = Column(String, nullable=False, unique=True)
    idempotency_key = Column(String, nullable=False, unique=True)
    
    amount = Column(Float, nullable=False)
    currency = Column(String, default="ETB")
    status = Column(String, default="PENDING") # PENDING, SUCCESS, FAILED
    
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.UTC))
    
    booking = relationship("Booking", back_populates="payment")

class AvailabilityBlock(Base):
    """
    Blocks out dates for specific inventory to prevent double-booking.
    """
    id = Column(Integer, primary_key=True, index=True)
    item_type = Column(Enum(BookingItemType), nullable=False)
    item_id = Column(Integer, nullable=False)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    reason = Column(String) # e.g., 'BOOKED', 'MAINTENANCE'
    booking_id = Column(Integer, ForeignKey("booking.id"), nullable=True)

class Review(Base):
    id = Column(Integer, primary_key=True, index=True)
    traveler_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    item_type = Column(Enum(BookingItemType), nullable=False)
    item_id = Column(Integer, nullable=False)
    booking_id = Column(Integer, ForeignKey("booking.id"), nullable=False)
    
    rating = Column(Integer, nullable=False) # 1-5
    comment = Column(Text)
    provider_response = Column(Text)
    
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.UTC))
