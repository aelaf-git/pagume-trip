"""Add hotel cover_image and profile_picture columns.

Revision ID: 004_hotel_images
Revises: 003_portal_persistence
Create Date: 2026-08-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_hotel_images"
down_revision: Union[str, None] = "003_portal_persistence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("hotel", sa.Column("cover_image", sa.String(), nullable=True))
    op.add_column("hotel", sa.Column("profile_picture", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("hotel", "profile_picture")
    op.drop_column("hotel", "cover_image")
