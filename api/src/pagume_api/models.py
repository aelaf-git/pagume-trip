from datetime import datetime, UTC

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from pagume_api.db import Base


class Destination(Base):
    __tablename__ = "destinations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    region: Mapped[str] = mapped_column(String(128), default="")
    zone: Mapped[str] = mapped_column(String(128), default="")
    woreda: Mapped[str | None] = mapped_column(String(128), nullable=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(64), default="destination")
    recommended_duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(32), default="VERIFIED")

    hotels: Mapped[list["Hotel"]] = relationship(back_populates="destination")
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="destination")
    tours: Mapped[list["TourPackage"]] = relationship(back_populates="destination")


class Hotel(Base):
    __tablename__ = "hotels"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    destination_id: Mapped[str] = mapped_column(ForeignKey("destinations.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    property_type: Mapped[str] = mapped_column(String(64), default="hotel")
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    amenities: Mapped[list] = mapped_column(JSON, default=list)
    rating: Mapped[float] = mapped_column(Float, default=0)
    comfort_level: Mapped[str] = mapped_column(String(32), default="standard")
    check_in_time: Mapped[str] = mapped_column(String(16), default="14:00")
    check_out_time: Mapped[str] = mapped_column(String(16), default="11:00")
    provider_status: Mapped[str] = mapped_column(String(32), default="VERIFIED")

    destination: Mapped[Destination] = relationship(back_populates="hotels")
    rooms: Mapped[list["HotelRoom"]] = relationship(
        back_populates="hotel", cascade="all, delete-orphan"
    )
    availability: Mapped[list["HotelAvailability"]] = relationship(
        back_populates="hotel", cascade="all, delete-orphan"
    )


class HotelRoom(Base):
    __tablename__ = "hotel_rooms"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotels.id"), index=True)
    room_type: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(Text, default="")
    capacity: Mapped[int] = mapped_column(Integer)
    beds: Mapped[int] = mapped_column(Integer, default=1)
    amenities: Mapped[list] = mapped_column(JSON, default=list)
    nightly_price_etb: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="ETB")

    hotel: Mapped[Hotel] = relationship(back_populates="rooms")
    reservations: Mapped[list["RoomReservation"]] = relationship(
        back_populates="room", cascade="all, delete-orphan"
    )


class HotelAvailability(Base):
    __tablename__ = "hotel_availability"
    __table_args__ = (UniqueConstraint("hotel_id", "day", name="uq_hotel_day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotels.id"), index=True)
    day: Mapped[str] = mapped_column(String(10), index=True)

    hotel: Mapped[Hotel] = relationship(back_populates="availability")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    destination_id: Mapped[str] = mapped_column(ForeignKey("destinations.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    make: Mapped[str] = mapped_column(String(64))
    model: Mapped[str] = mapped_column(String(64))
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seats: Mapped[int] = mapped_column(Integer)
    transmission: Mapped[str] = mapped_column(String(32), default="manual")
    fuel_type: Mapped[str] = mapped_column(String(32), default="diesel")
    is_4wd: Mapped[bool] = mapped_column(Boolean, default=False)
    daily_price_etb: Mapped[float] = mapped_column(Float)
    weekly_price_etb: Mapped[float | None] = mapped_column(Float, nullable=True)
    deposit_etb: Mapped[float] = mapped_column(Float, default=0)
    insurance: Mapped[str] = mapped_column(String(64), default="")
    driver_included: Mapped[bool] = mapped_column(Boolean, default=True)
    service_type: Mapped[str] = mapped_column(String(64), default="private_car")
    pickup_location: Mapped[str] = mapped_column(String(255), default="")
    provider_status: Mapped[str] = mapped_column(String(32), default="VERIFIED")
    currency: Mapped[str] = mapped_column(String(8), default="ETB")

    destination: Mapped[Destination] = relationship(back_populates="vehicles")
    availability: Mapped[list["VehicleAvailability"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )


class VehicleAvailability(Base):
    __tablename__ = "vehicle_availability"
    __table_args__ = (UniqueConstraint("vehicle_id", "day", name="uq_vehicle_day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_id: Mapped[str] = mapped_column(ForeignKey("vehicles.id"), index=True)
    day: Mapped[str] = mapped_column(String(10), index=True)

    vehicle: Mapped[Vehicle] = relationship(back_populates="availability")


class TourPackage(Base):
    __tablename__ = "tour_packages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    destination_id: Mapped[str] = mapped_column(ForeignKey("destinations.id"), index=True)
    agency_id: Mapped[str] = mapped_column(String(64), default="")
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    duration_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_etb: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="ETB")
    max_participants: Mapped[int] = mapped_column(Integer, default=12)
    min_participants: Mapped[int] = mapped_column(Integer, default=1)
    included: Mapped[list] = mapped_column(JSON, default=list)
    excluded: Mapped[list] = mapped_column(JSON, default=list)
    category: Mapped[str] = mapped_column(String(64), default="tour")
    seats_remaining: Mapped[int] = mapped_column(Integer, default=8)
    provider_status: Mapped[str] = mapped_column(String(32), default="VERIFIED")

    destination: Mapped[Destination] = relationship(back_populates="tours")
    availability: Mapped[list["TourAvailability"]] = relationship(
        back_populates="tour", cascade="all, delete-orphan"
    )


class TourAvailability(Base):
    __tablename__ = "tour_availability"
    __table_args__ = (UniqueConstraint("tour_id", "day", name="uq_tour_day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tour_id: Mapped[str] = mapped_column(ForeignKey("tour_packages.id"), index=True)
    day: Mapped[str] = mapped_column(String(10), index=True)

    tour: Mapped[TourPackage] = relationship(back_populates="availability")


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    destination_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="DRAFT")
    option: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    booking_ids: Mapped[list] = mapped_column(JSON, default=list)
    total_etb: Mapped[float] = mapped_column(Float, default=0)
    currency: Mapped[str] = mapped_column(String(8), default="ETB")

    itinerary: Mapped[list["ItineraryItem"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan", order_by="ItineraryItem.day"
    )


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id"), index=True)
    day: Mapped[int] = mapped_column(Integer)
    time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    entity_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    trip: Mapped[Trip] = relationship(back_populates="itinerary")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    provider_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    price_etb: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="ETB")
    status: Mapped[str] = mapped_column(String(32), default="PENDING")
    payment_status: Mapped[str] = mapped_column(String(32), default="UNPAID")
    confirmation_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True)
    cancellation_policy: Mapped[str] = mapped_column(Text, default="")

    items: Mapped[list["BookingItem"]] = relationship(
        back_populates="booking", cascade="all, delete-orphan"
    )
    reservations: Mapped[list["RoomReservation"]] = relationship(
        back_populates="booking", cascade="all, delete-orphan"
    )


class BookingItem(Base):
    __tablename__ = "booking_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), index=True)
    service_type: Mapped[str] = mapped_column(String(32))
    entity_id: Mapped[str] = mapped_column(String(64))
    name: Mapped[str] = mapped_column(String(255))
    price_etb: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="ETB")
    room_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    check_in: Mapped[str | None] = mapped_column(String(10), nullable=True)
    check_out: Mapped[str | None] = mapped_column(String(10), nullable=True)

    booking: Mapped[Booking] = relationship(back_populates="items")


class RoomReservation(Base):
    __tablename__ = "room_reservations"
    __table_args__ = (UniqueConstraint("room_id", "day", name="uq_room_day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[str] = mapped_column(ForeignKey("hotel_rooms.id"), index=True)
    day: Mapped[str] = mapped_column(String(10), index=True)
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="HOLD")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC).replace(tzinfo=None)
    )

    room: Mapped[HotelRoom] = relationship(back_populates="reservations")
    booking: Mapped[Booking] = relationship(back_populates="reservations")


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"
    __table_args__ = (UniqueConstraint("operation", "key", name="uq_idempotency"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    operation: Mapped[str] = mapped_column(String(64))
    key: Mapped[str] = mapped_column(String(128), index=True)
    booking_id: Mapped[str] = mapped_column(String(64))
