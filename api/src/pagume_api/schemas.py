from pydantic import BaseModel, Field


class DestinationOut(BaseModel):
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

    model_config = {"from_attributes": True}


class DestinationCreate(DestinationOut):
    pass


class HotelRoomOut(BaseModel):
    id: str
    hotel_id: str
    room_type: str
    description: str = ""
    capacity: int
    beds: int = 1
    amenities: list[str] = Field(default_factory=list)
    nightly_price_etb: float
    currency: str = "ETB"

    model_config = {"from_attributes": True}


class HotelOut(BaseModel):
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
    rooms: list[HotelRoomOut] = Field(default_factory=list)
    available_dates: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class HotelCreate(HotelOut):
    pass


class VehicleOut(BaseModel):
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

    model_config = {"from_attributes": True}


class VehicleCreate(VehicleOut):
    pass


class TourPackageOut(BaseModel):
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

    model_config = {"from_attributes": True}


class TourCreate(TourPackageOut):
    pass


class ItineraryItemIn(BaseModel):
    day: int
    time: str | None = None
    title: str
    description: str = ""
    entity_type: str | None = None
    entity_id: str | None = None


class TripOptionIn(BaseModel):
    option_id: str
    label: str
    items: list[dict] = Field(default_factory=list)
    total_etb: float
    currency: str = "ETB"
    over_budget: bool = False


class TripIn(BaseModel):
    id: str = ""
    user_id: str | None = None
    destination_id: str | None = None
    status: str = "DRAFT"
    option: TripOptionIn | dict | None = None
    itinerary: list[ItineraryItemIn] = Field(default_factory=list)
    booking_ids: list[str] = Field(default_factory=list)
    total_etb: float = 0
    currency: str = "ETB"


class TripOut(BaseModel):
    id: str
    user_id: str | None = None
    destination_id: str | None = None
    status: str = "DRAFT"
    option: dict | None = None
    itinerary: list[ItineraryItemIn] = Field(default_factory=list)
    booking_ids: list[str] = Field(default_factory=list)
    total_etb: float = 0
    currency: str = "ETB"


class BookingItemIn(BaseModel):
    service_type: str
    entity_id: str
    name: str
    price_etb: float
    currency: str = "ETB"


class PrepareBookingIn(BaseModel):
    items: list[BookingItemIn]
    user_id: str | None = None


class BookingOut(BaseModel):
    id: str
    user_id: str | None = None
    provider_id: str | None = None
    items: list[BookingItemIn] = Field(default_factory=list)
    price_etb: float
    currency: str = "ETB"
    status: str
    payment_status: str = "UNPAID"
    confirmation_code: str | None = None
    idempotency_key: str | None = None
    cancellation_policy: str = ""


class Results(BaseModel):
    results: list
