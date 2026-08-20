from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pagume_api.portal.db.base_class import Base

class Destination(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    region = Column(String)
    zone = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    category = Column(String)
    images = Column(JSON, default=list) # Store list of URLs
    status = Column(String, default="ACTIVE")
    verification_status = Column(String, default="VERIFIED")
