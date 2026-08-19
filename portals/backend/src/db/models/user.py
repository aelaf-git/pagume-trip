from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from src.db.base_class import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    TRAVELER = "TRAVELER"
    HOTEL_PROVIDER = "HOTEL_PROVIDER"
    TOUR_AGENCY = "TOUR_AGENCY"
    CAR_RENTAL = "CAR_RENTAL"
    DRIVER = "DRIVER"
    GUIDE = "GUIDE"

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.TRAVELER)
    is_active = Column(Boolean(), default=True)
    is_verified = Column(Boolean(), default=False)
