from pydantic import BaseModel, Field


class Destination(BaseModel):
    id: str
    name: str
    description: str = ""
    region: str = ""
    zone: str = ""
    woreda: str | None = None
    latitude: float
    longitude: float
    category: str = "destination"
    recommended_duration_days: int | None = None
    verification_status: str = "VERIFIED"


class HotelRoom(BaseModel):
    id: str
    hotel_id: str
    room_type: str
    description: str = ""
    capacity: int
    beds: int = 1
    amenities: list[str] = Field(default_factory=list)
    nightly_price_etb: float
    currency: str = "ETB"


class Hotel(BaseModel):
    id: str
    destination_id: str
    name: str
    description: str = ""
    property_type: str = "hotel"
    latitude: float
    longitude: float
    amenities: list[str] = Field(default_factory=list)
    rating: float = 0.0
    comfort_level: str = "standard"
    check_in_time: str = "14:00"
    check_out_time: str = "11:00"
    provider_status: str = "VERIFIED"
    rooms: list[HotelRoom] = Field(default_factory=list)
    available_dates: list[str] = Field(default_factory=list)


class Vehicle(BaseModel):
    id: str
    destination_id: str
    name: str
    make: str
    model: str
    year: int | None = None
    seats: int
    transmission: str = "manual"
    fuel_type: str = "diesel"
    is_4wd: bool = False
    daily_price_etb: float
    weekly_price_etb: float | None = None
    deposit_etb: float = 0
    insurance: str = ""
    driver_included: bool = True
    service_type: str = "private_car"
    pickup_location: str = ""
    provider_status: str = "VERIFIED"
    available_dates: list[str] = Field(default_factory=list)
    currency: str = "ETB"


class TourPackage(BaseModel):
    id: str
    destination_id: str
    agency_id: str
    name: str
    description: str = ""
    duration_hours: float | None = None
    duration_days: int | None = None
    price_etb: float
    currency: str = "ETB"
    max_participants: int = 12
    min_participants: int = 1
    included: list[str] = Field(default_factory=list)
    excluded: list[str] = Field(default_factory=list)
    category: str = "tour"
    seats_remaining: int = 8
    provider_status: str = "VERIFIED"
    available_dates: list[str] = Field(default_factory=list)
