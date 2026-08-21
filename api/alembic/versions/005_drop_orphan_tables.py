"""Drop unused empty orphan tables (data-safe).

Revision ID: 005_drop_orphan_tables
Revises: 004_hotel_images
Create Date: 2026-08-21

Only drops tables that are not mapped by current portal/agent models and
that contain zero rows. Tables with data are left intact and the migration
raises so nothing is erased unexpectedly.

"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import inspect, text

revision: str = "005_drop_orphan_tables"
down_revision: Union[str, None] = "004_hotel_images"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Present in live DB, absent from SQLAlchemy metadata. Never includes
# alembic_version, spatial_ref_sys, or any mapped portal/agent table.
ORPHAN_TABLES: tuple[str, ...] = (
    # Dependents of singular `booking` first, then `booking`, then unrelated.
    "availabilityblock",
    "payment",
    "review",
    "booking",
    "tourguideprofile",
)


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())

    for table in ORPHAN_TABLES:
        if table not in existing:
            continue

        count = bind.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
        if count and int(count) > 0:
            raise RuntimeError(
                f"Refusing to drop orphan table '{table}': it has {count} row(s). "
                "Empty the table or remove it from ORPHAN_TABLES before retrying."
            )

        # CASCADE clears leftover FKs among orphans only; mapped tables are untouched.
        bind.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))


def downgrade() -> None:
    # Orphan tables were unused and empty; their full DDL is not reconstructed.
    # Re-creating stubs would not restore application behavior.
    pass
