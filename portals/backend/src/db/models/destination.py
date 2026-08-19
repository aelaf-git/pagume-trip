from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from src.db.base_class import Base

class Destination(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    region = Column(String)
    zone = Column(String)
    # Keeping raw floats for easy JSON serialization
    latitude = Column(Float)
    longitude = Column(Float)
    # PostGIS geometry point for spatial queries
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    category = Column(String)
    images = Column(JSON, default=list) # Store list of URLs
    status = Column(String, default="ACTIVE")
    verification_status = Column(String, default="VERIFIED")
