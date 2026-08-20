from src.db.base_class import Base
from src.db.models.user import User
from src.db.models.destination import Destination
from src.db.models.provider import Hotel, Room, TourPackage, Vehicle, DriverProfile, TourGuideProfile
from src.db.models.booking import Booking, Payment, AvailabilityBlock, Review

# This file is used by Alembic to import all models
# and ensure they are registered with the Base metadata.
