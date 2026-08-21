from sqlalchemy import Column, Integer, String, Float, Text, JSON
from pagume_api.portal.db.base_class import Base


class Destination(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    region = Column(String)
    zone = Column(String)
    woreda = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    category = Column(String)
    historical_info = Column(Text)
    accessibility = Column(Text)
    seasonal_info = Column(Text)
    images = Column(JSON, default=list)
    status = Column(String, default="ACTIVE")
    verification_status = Column(String, default="VERIFIED")
