"""Add FRS portal columns to existing hotel/room/tour/vehicle tables.

Revision ID: 002_portal_frs_cols
Revises: 001_portal_frs
Create Date: 2026-08-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_portal_frs_cols"
down_revision: Union[str, None] = "001_portal_frs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("hotel", sa.Column("check_in_time", sa.String(), server_default="14:00"))
    op.add_column("hotel", sa.Column("check_out_time", sa.String(), server_default="11:00"))
    op.add_column("hotel", sa.Column("cancellation_policy", sa.Text()))

    op.add_column("room", sa.Column("availability_dates", sa.JSON()))

    op.add_column(
        "tourpackage", sa.Column("package_type", sa.String(), server_default="multi_day")
    )
    op.add_column("tourpackage", sa.Column("accommodation", sa.Text()))
    op.add_column("tourpackage", sa.Column("transportation", sa.Text()))
    op.add_column("tourpackage", sa.Column("activities", sa.JSON()))
    op.add_column("tourpackage", sa.Column("guide", sa.String()))
    op.add_column("tourpackage", sa.Column("availability_dates", sa.JSON()))

    op.add_column("vehicle", sa.Column("category", sa.String(), server_default="car"))
    op.add_column("vehicle", sa.Column("pickup_locations", sa.JSON()))
    op.add_column("vehicle", sa.Column("dropoff_locations", sa.JSON()))
    op.add_column("vehicle", sa.Column("rental_policies", sa.Text()))
    op.add_column("vehicle", sa.Column("availability_dates", sa.JSON()))


def downgrade() -> None:
    op.drop_column("vehicle", "availability_dates")
    op.drop_column("vehicle", "rental_policies")
    op.drop_column("vehicle", "dropoff_locations")
    op.drop_column("vehicle", "pickup_locations")
    op.drop_column("vehicle", "category")

    op.drop_column("tourpackage", "availability_dates")
    op.drop_column("tourpackage", "guide")
    op.drop_column("tourpackage", "activities")
    op.drop_column("tourpackage", "transportation")
    op.drop_column("tourpackage", "accommodation")
    op.drop_column("tourpackage", "package_type")

    op.drop_column("room", "availability_dates")

    op.drop_column("hotel", "cancellation_policy")
    op.drop_column("hotel", "check_out_time")
    op.drop_column("hotel", "check_in_time")
