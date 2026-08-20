"""Initial portal schema with FRS hotel/agency/car/driver fields.

Revision ID: 001_portal_frs
Revises:
Create Date: 2026-08-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001_portal_frs"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("role", sa.Enum(
            "ADMIN", "TRAVELER", "HOTEL_PROVIDER", "TOUR_AGENCY",
            "CAR_RENTAL", "DRIVER", "GUIDE",
            name="userrole",
            create_constraint=True,
        ), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false")),
    )
    op.create_index("ix_user_email", "user", ["email"], unique=True)
    op.create_index("ix_user_id", "user", ["id"])

    op.create_table(
        "destination",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("region", sa.String()),
        sa.Column("zone", sa.String()),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("category", sa.String()),
        sa.Column("images", sa.JSON()),
        sa.Column("status", sa.String(), server_default="ACTIVE"),
        sa.Column("verification_status", sa.String(), server_default="VERIFIED"),
    )
    op.create_index("ix_destination_id", "destination", ["id"])
    op.create_index("ix_destination_name", "destination", ["name"])

    op.create_table(
        "hotel",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("provider_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("address", sa.String()),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("contact_details", sa.String()),
        sa.Column("images", sa.JSON()),
        sa.Column("amenities", sa.JSON()),
        sa.Column("policies", sa.JSON()),
        sa.Column("check_in_time", sa.String(), server_default="14:00"),
        sa.Column("check_out_time", sa.String(), server_default="11:00"),
        sa.Column("cancellation_policy", sa.Text()),
    )
    op.create_index("ix_hotel_id", "hotel", ["id"])

    op.create_table(
        "room",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("hotel_id", sa.Integer(), sa.ForeignKey("hotel.id"), nullable=False),
        sa.Column("room_type", sa.String(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("capacity", sa.Integer(), server_default="2"),
        sa.Column("beds", sa.Integer(), server_default="1"),
        sa.Column("amenities", sa.JSON()),
        sa.Column("images", sa.JSON()),
        sa.Column("price_per_night", sa.Float(), nullable=False),
        sa.Column("is_available", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("availability_dates", sa.JSON()),
    )
    op.create_index("ix_room_id", "room", ["id"])

    op.create_table(
        "tourpackage",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("agency_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("destination", sa.String()),
        sa.Column("package_type", sa.String(), server_default="multi_day"),
        sa.Column("duration_days", sa.Integer()),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("max_participants", sa.Integer()),
        sa.Column("min_participants", sa.Integer()),
        sa.Column("included_services", sa.JSON()),
        sa.Column("excluded_services", sa.JSON()),
        sa.Column("accommodation", sa.Text()),
        sa.Column("transportation", sa.Text()),
        sa.Column("activities", sa.JSON()),
        sa.Column("guide", sa.String()),
        sa.Column("images", sa.JSON()),
        sa.Column("availability_dates", sa.JSON()),
        sa.Column("cancellation_policy", sa.Text()),
    )
    op.create_index("ix_tourpackage_id", "tourpackage", ["id"])

    op.create_table(
        "vehicle",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("rental_company_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("make", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("year", sa.Integer()),
        sa.Column("seats", sa.Integer()),
        sa.Column("transmission", sa.String()),
        sa.Column("fuel_type", sa.String()),
        sa.Column("is_4wd", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("category", sa.String(), server_default="car"),
        sa.Column("images", sa.JSON()),
        sa.Column("daily_price", sa.Float(), nullable=False),
        sa.Column("weekly_price", sa.Float()),
        sa.Column("deposit", sa.Float()),
        sa.Column("insurance_details", sa.Text()),
        sa.Column("driver_available", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("pickup_locations", sa.JSON()),
        sa.Column("dropoff_locations", sa.JSON()),
        sa.Column("rental_policies", sa.Text()),
        sa.Column("availability_dates", sa.JSON()),
    )
    op.create_index("ix_vehicle_id", "vehicle", ["id"])

    op.create_table(
        "driverprofile",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False, unique=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("profile_picture_url", sa.String()),
        sa.Column("license_number", sa.String()),
        sa.Column("license_expiry", sa.String()),
        sa.Column("languages", sa.JSON()),
        sa.Column("experience_level", sa.String()),
        sa.Column("location", sa.String()),
        sa.Column("availability_ranges", sa.JSON()),
        sa.Column("provider_association", sa.String()),
        sa.Column("verification_status", sa.String(), server_default="UNDER_REVIEW"),
        sa.Column("documents", sa.JSON()),
        sa.Column("guiding_day_rate", sa.Float()),
        sa.Column("driving_day_rate", sa.Float()),
    )
    op.create_index("ix_driverprofile_id", "driverprofile", ["id"])


def downgrade() -> None:
    op.drop_table("driverprofile")
    op.drop_table("vehicle")
    op.drop_table("tourpackage")
    op.drop_table("room")
    op.drop_table("hotel")
    op.drop_table("destination")
    op.drop_table("user")
    op.execute("DROP TYPE IF EXISTS userrole")
