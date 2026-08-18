from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, AnyUrl

class RoomBase(BaseModel):
    room_type: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    capacity: int = Field(default=2, ge=1, le=20, description="Number of people the room can accommodate")
    beds: int = Field(default=1, ge=1, le=10)
    amenities: List[str] = Field(default_factory=list)
    images: List[AnyUrl] = Field(default_factory=list)
    price_per_night: float = Field(..., gt=0, description="Price per night in ETB")
    is_available: bool = True


class RoomCreate(RoomBase):
    pass


class RoomResponse(RoomBase):
    id: int
    hotel_id: int
    
    model_config = {"from_attributes": True}


class HotelBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    address: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    contact_details: Optional[str] = Field(None, max_length=255)
    images: List[AnyUrl] = Field(default_factory=list)
    amenities: List[str] = Field(default_factory=list)
    policies: Dict[str, Any] = Field(default_factory=dict)


class HotelCreate(HotelBase):
    pass


class HotelResponse(HotelBase):
    id: int
    provider_id: int
    rooms: List[RoomResponse] = Field(default_factory=list)
    
    model_config = {"from_attributes": True}


class TourPackageBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    destination: Optional[str] = Field(None, max_length=200)
    duration_days: Optional[int] = Field(None, ge=1, le=365)
    price: float = Field(..., gt=0)
    max_participants: Optional[int] = Field(None, ge=1)
    min_participants: Optional[int] = Field(None, ge=1)
    included_services: List[str] = Field(default_factory=list)
    excluded_services: List[str] = Field(default_factory=list)
    images: List[AnyUrl] = Field(default_factory=list)
    cancellation_policy: Optional[str] = Field(None, max_length=1000)


class TourPackageCreate(TourPackageBase):
    pass


class TourPackageResponse(TourPackageBase):
    id: int
    agency_id: int
    
    model_config = {"from_attributes": True}


class VehicleBase(BaseModel):
    make: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    year: Optional[int] = Field(None, ge=1990, le=2030)
    seats: Optional[int] = Field(None, ge=1, le=60)
    transmission: Optional[str] = Field(None, pattern="^(Manual|Automatic)$")
    fuel_type: Optional[str] = Field(None, max_length=50)
    is_4wd: bool = False
    images: List[AnyUrl] = Field(default_factory=list)
    daily_price: float = Field(..., gt=0)
    weekly_price: Optional[float] = Field(None, gt=0)
    deposit: Optional[float] = Field(None, ge=0)
    insurance_details: Optional[str] = Field(None, max_length=1000)
    driver_available: bool = False


class VehicleCreate(VehicleBase):
    pass


class VehicleResponse(VehicleBase):
    id: int
    rental_company_id: int
    
    model_config = {"from_attributes": True}
