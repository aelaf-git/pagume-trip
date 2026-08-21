from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field

AvailabilityEntry = Union[str, Dict[str, Any]]


class RoomBase(BaseModel):
    room_type: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    capacity: int = Field(default=2, ge=1, le=20)
    beds: int = Field(default=1, ge=1, le=10)
    amenities: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    price_per_night: float = Field(..., gt=0)
    is_available: bool = True
    availability_dates: List[AvailabilityEntry] = Field(default_factory=list)


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_type: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    beds: Optional[int] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    price_per_night: Optional[float] = None
    is_available: Optional[bool] = None
    availability_dates: Optional[List[AvailabilityEntry]] = None


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
    cover_image: Optional[str] = Field(None, max_length=1000)
    profile_picture: Optional[str] = Field(None, max_length=1000)
    images: List[str] = Field(default_factory=list)
    amenities: List[str] = Field(default_factory=list)
    policies: Dict[str, Any] = Field(default_factory=dict)
    check_in_time: str = "14:00"
    check_out_time: str = "11:00"
    cancellation_policy: Optional[str] = ""


class HotelCreate(HotelBase):
    pass


class HotelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_details: Optional[str] = None
    cover_image: Optional[str] = None
    profile_picture: Optional[str] = None
    images: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    policies: Optional[Dict[str, Any]] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    cancellation_policy: Optional[str] = None


class HotelResponse(HotelBase):
    id: int
    provider_id: int
    rooms: List[RoomResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class TourPackageBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    destination: Optional[str] = Field(None, max_length=200)
    package_type: str = Field(default="multi_day", pattern="^(day_trip|multi_day|custom)$")
    duration_days: Optional[int] = Field(None, ge=1, le=365)
    price: float = Field(..., gt=0)
    max_participants: Optional[int] = Field(None, ge=1)
    min_participants: Optional[int] = Field(None, ge=1)
    included_services: List[str] = Field(default_factory=list)
    excluded_services: List[str] = Field(default_factory=list)
    accommodation: Optional[str] = ""
    transportation: Optional[str] = ""
    activities: List[str] = Field(default_factory=list)
    guide: Optional[str] = ""
    images: List[str] = Field(default_factory=list)
    availability_dates: List[AvailabilityEntry] = Field(default_factory=list)
    cancellation_policy: Optional[str] = Field(None, max_length=1000)


class TourPackageCreate(TourPackageBase):
    pass


class TourPackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    destination: Optional[str] = None
    package_type: Optional[str] = None
    duration_days: Optional[int] = None
    price: Optional[float] = None
    max_participants: Optional[int] = None
    min_participants: Optional[int] = None
    included_services: Optional[List[str]] = None
    excluded_services: Optional[List[str]] = None
    accommodation: Optional[str] = None
    transportation: Optional[str] = None
    activities: Optional[List[str]] = None
    guide: Optional[str] = None
    images: Optional[List[str]] = None
    availability_dates: Optional[List[AvailabilityEntry]] = None
    cancellation_policy: Optional[str] = None


class TourPackageResponse(TourPackageBase):
    id: int
    agency_id: int

    model_config = {"from_attributes": True}


class VehicleBase(BaseModel):
    make: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    year: Optional[int] = Field(None, ge=1990, le=2030)
    seats: Optional[int] = Field(None, ge=1, le=60)
    transmission: Optional[str] = None
    fuel_type: Optional[str] = Field(None, max_length=50)
    is_4wd: bool = False
    category: str = "car"
    images: List[str] = Field(default_factory=list)
    daily_price: float = Field(..., gt=0)
    weekly_price: Optional[float] = Field(None, gt=0)
    deposit: Optional[float] = Field(None, ge=0)
    insurance_details: Optional[str] = Field(None, max_length=1000)
    driver_available: bool = False
    pickup_locations: List[str] = Field(default_factory=list)
    dropoff_locations: List[str] = Field(default_factory=list)
    rental_policies: Optional[str] = ""
    availability_dates: List[AvailabilityEntry] = Field(default_factory=list)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    seats: Optional[int] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    is_4wd: Optional[bool] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    daily_price: Optional[float] = None
    weekly_price: Optional[float] = None
    deposit: Optional[float] = None
    insurance_details: Optional[str] = None
    driver_available: Optional[bool] = None
    pickup_locations: Optional[List[str]] = None
    dropoff_locations: Optional[List[str]] = None
    rental_policies: Optional[str] = None
    availability_dates: Optional[List[AvailabilityEntry]] = None


class VehicleResponse(VehicleBase):
    id: int
    rental_company_id: int

    model_config = {"from_attributes": True}


class DriverProfileBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    profile_picture_url: Optional[str] = ""
    license_number: Optional[str] = ""
    license_expiry: Optional[str] = ""
    languages: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = ""
    location: Optional[str] = ""
    availability_ranges: List[Dict[str, Any]] = Field(default_factory=list)
    provider_association: Optional[str] = ""
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    guiding_day_rate: Optional[float] = 0
    driving_day_rate: Optional[float] = 0


class DriverProfileCreate(DriverProfileBase):
    pass


class DriverProfileUpdate(BaseModel):
    name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[str] = None
    languages: Optional[List[str]] = None
    experience_level: Optional[str] = None
    location: Optional[str] = None
    availability_ranges: Optional[List[Dict[str, Any]]] = None
    provider_association: Optional[str] = None
    documents: Optional[List[Dict[str, Any]]] = None
    guiding_day_rate: Optional[float] = None
    driving_day_rate: Optional[float] = None


class DriverProfileResponse(DriverProfileBase):
    id: int
    user_id: int
    verification_status: str = "UNDER_REVIEW"

    model_config = {"from_attributes": True}


class AvailabilityUpdate(BaseModel):
    availability_dates: List[AvailabilityEntry] = Field(default_factory=list)
