from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class RoomBase(BaseModel):
    room_type: str
    description: Optional[str] = None
    capacity: int = 2
    beds: int = 1
    amenities: List[str] = []
    images: List[str] = []
    price_per_night: float
    is_available: bool = True


class RoomCreate(RoomBase):
    pass


class RoomResponse(RoomBase):
    id: int
    hotel_id: int
    
    model_config = {"from_attributes": True}


class HotelBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_details: Optional[str] = None
    images: List[str] = []
    amenities: List[str] = []
    policies: Dict[str, Any] = {}


class HotelCreate(HotelBase):
    pass


class HotelResponse(HotelBase):
    id: int
    provider_id: int
    rooms: List[RoomResponse] = []
    
    model_config = {"from_attributes": True}


class TourPackageBase(BaseModel):
    name: str
    description: Optional[str] = None
    destination: Optional[str] = None
    duration_days: Optional[int] = None
    price: float
    max_participants: Optional[int] = None
    min_participants: Optional[int] = None
    included_services: List[str] = []
    excluded_services: List[str] = []
    images: List[str] = []
    cancellation_policy: Optional[str] = None


class TourPackageCreate(TourPackageBase):
    pass


class TourPackageResponse(TourPackageBase):
    id: int
    agency_id: int
    
    model_config = {"from_attributes": True}


class VehicleBase(BaseModel):
    make: str
    model: str
    year: Optional[int] = None
    seats: Optional[int] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    is_4wd: bool = False
    images: List[str] = []
    daily_price: float
    weekly_price: Optional[float] = None
    deposit: Optional[float] = None
    insurance_details: Optional[str] = None
    driver_available: bool = False


class VehicleCreate(VehicleBase):
    pass


class VehicleResponse(VehicleBase):
    id: int
    rental_company_id: int
    
    model_config = {"from_attributes": True}
