from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from pagume_api.portal.db.base_class import Base


class Hotel(Base):
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    contact_details = Column(String)
    cover_image = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    images = Column(JSON, default=list)
    amenities = Column(JSON, default=list)
    policies = Column(JSON, default=dict)
    check_in_time = Column(String, default="14:00")
    check_out_time = Column(String, default="11:00")
    cancellation_policy = Column(Text, default="")

    rooms = relationship("Room", back_populates="hotel", cascade="all, delete-orphan")
    provider = relationship("User", foreign_keys=[provider_id])


class Room(Base):
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotel.id"), nullable=False)
    room_type = Column(String, nullable=False)
    description = Column(Text)
    capacity = Column(Integer, default=2)
    beds = Column(Integer, default=1)
    amenities = Column(JSON, default=list)
    images = Column(JSON, default=list)
    price_per_night = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True)
    availability_dates = Column(JSON, default=list)

    hotel = relationship("Hotel", back_populates="rooms")


class TourPackage(Base):
    id = Column(Integer, primary_key=True, index=True)
    agency_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    destination = Column(String)
    package_type = Column(String, default="multi_day")  # day_trip | multi_day | custom
    duration_days = Column(Integer)
    price = Column(Float, nullable=False)
    max_participants = Column(Integer)
    min_participants = Column(Integer)
    included_services = Column(JSON, default=list)
    excluded_services = Column(JSON, default=list)
    accommodation = Column(Text, default="")
    transportation = Column(Text, default="")
    activities = Column(JSON, default=list)
    guide = Column(String, default="")
    images = Column(JSON, default=list)
    availability_dates = Column(JSON, default=list)
    cancellation_policy = Column(Text)

    agency = relationship("User", foreign_keys=[agency_id])


class Vehicle(Base):
    id = Column(Integer, primary_key=True, index=True)
    rental_company_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer)
    seats = Column(Integer)
    transmission = Column(String)
    fuel_type = Column(String)
    is_4wd = Column(Boolean, default=False)
    category = Column(String, default="car")
    images = Column(JSON, default=list)
    daily_price = Column(Float, nullable=False)
    weekly_price = Column(Float)
    deposit = Column(Float)
    insurance_details = Column(Text)
    driver_available = Column(Boolean, default=False)
    pickup_locations = Column(JSON, default=list)
    dropoff_locations = Column(JSON, default=list)
    rental_policies = Column(Text, default="")
    availability_dates = Column(JSON, default=list)

    company = relationship("User", foreign_keys=[rental_company_id])


class DriverProfile(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), unique=True, nullable=False)
    name = Column(String, nullable=False)
    profile_picture_url = Column(String, default="")
    license_number = Column(String, default="")
    license_expiry = Column(String, default="")
    languages = Column(JSON, default=list)
    experience_level = Column(String, default="")
    location = Column(String, default="")
    availability_ranges = Column(JSON, default=list)
    provider_association = Column(String, default="")
    verification_status = Column(String, default="UNDER_REVIEW")
    documents = Column(JSON, default=list)
    guiding_day_rate = Column(Float, default=0)
    driving_day_rate = Column(Float, default=0)

    user = relationship("User", foreign_keys=[user_id])
