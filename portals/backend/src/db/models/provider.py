from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from src.db.base_class import Base

class Hotel(Base):
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    contact_details = Column(String)
    images = Column(JSON, default=list)
    amenities = Column(JSON, default=list)
    policies = Column(JSON, default={})
    
    rooms = relationship("Room", back_populates="hotel")
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
    
    hotel = relationship("Hotel", back_populates="rooms")


class TourPackage(Base):
    id = Column(Integer, primary_key=True, index=True)
    agency_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    destination = Column(String)
    duration_days = Column(Integer)
    price = Column(Float, nullable=False)
    max_participants = Column(Integer)
    min_participants = Column(Integer)
    included_services = Column(JSON, default=list)
    excluded_services = Column(JSON, default=list)
    images = Column(JSON, default=list)
    cancellation_policy = Column(Text)
    
    agency = relationship("User", foreign_keys=[agency_id])


class Vehicle(Base):
    id = Column(Integer, primary_key=True, index=True)
    rental_company_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer)
    seats = Column(Integer)
    transmission = Column(String) # Manual/Auto
    fuel_type = Column(String)
    is_4wd = Column(Boolean, default=False)
    images = Column(JSON, default=list)
    daily_price = Column(Float, nullable=False)
    weekly_price = Column(Float)
    deposit = Column(Float)
    insurance_details = Column(Text)
    driver_available = Column(Boolean, default=False)
    
    company = relationship("User", foreign_keys=[rental_company_id])

class DriverProfile(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, unique=True)
    license_number = Column(String, nullable=False)
    languages = Column(JSON, default=list)
    experience_years = Column(Integer)
    location = Column(String)
    is_available = Column(Boolean, default=True)
    verification_status = Column(String, default="PENDING")
    
    user = relationship("User", foreign_keys=[user_id])

class TourGuideProfile(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, unique=True)
    expertise = Column(JSON, default=list) # e.g. ["Historical", "Wildlife"]
    languages = Column(JSON, default=list)
    location = Column(String)
    is_available = Column(Boolean, default=True)
    verification_status = Column(String, default="PENDING")
    
    user = relationship("User", foreign_keys=[user_id])
