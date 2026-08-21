"""Portal persistence tables and destination columns.

Revision ID: 003_portal_persistence
Revises: 002_portal_frs_cols
Create Date: 2026-08-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_portal_persistence"
down_revision: Union[str, None] = "002_portal_frs_cols"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("destination", sa.Column("woreda", sa.String(), nullable=True))
    op.add_column("destination", sa.Column("historical_info", sa.Text(), nullable=True))
    op.add_column("destination", sa.Column("accessibility", sa.Text(), nullable=True))
    op.add_column("destination", sa.Column("seasonal_info", sa.Text(), nullable=True))

    op.create_table(
        "providerprofile",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False, unique=True),
        sa.Column("business_name", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(), server_default="PENDING"),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("status_note", sa.Text(), nullable=True),
        sa.Column("registered_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_providerprofile_id", "providerprofile", ["id"])

    op.create_table(
        "providerdocument",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("doc_type", sa.String(), nullable=False),
        sa.Column("file_name", sa.String(), nullable=False),
        sa.Column("file_size", sa.Integer(), server_default="0"),
        sa.Column("url", sa.String(), nullable=True),
    )
    op.create_index("ix_providerdocument_id", "providerdocument", ["id"])
    op.create_index("ix_providerdocument_user_id", "providerdocument", ["user_id"])

    op.create_table(
        "portalbooking",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("provider_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("service_type", sa.String(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=True),
        sa.Column("service_name", sa.String(), nullable=False),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("customer_email", sa.String(), nullable=True),
        sa.Column("start_date", sa.String(), nullable=True),
        sa.Column("end_date", sa.String(), nullable=True),
        sa.Column("dates", sa.String(), nullable=True),
        sa.Column("price", sa.Float(), server_default="0"),
        sa.Column("booking_status", sa.String(), server_default="PENDING"),
        sa.Column("payment_status", sa.String(), server_default="UNPAID"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_portalbooking_id", "portalbooking", ["id"])
    op.create_index("ix_portalbooking_provider_id", "portalbooking", ["provider_id"])

    op.create_table(
        "portalpayment",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("provider_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("booking_id", sa.Integer(), sa.ForeignKey("portalbooking.id"), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(), server_default="ETB"),
        sa.Column("status", sa.String(), server_default="PENDING"),
        sa.Column("method", sa.String(), nullable=True),
        sa.Column("reference", sa.String(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_portalpayment_id", "portalpayment", ["id"])
    op.create_index("ix_portalpayment_provider_id", "portalpayment", ["provider_id"])

    op.create_table(
        "portalreview",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("provider_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("author_name", sa.String(), nullable=False),
        sa.Column("rating", sa.Integer(), server_default="5"),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), server_default="VISIBLE"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_portalreview_id", "portalreview", ["id"])
    op.create_index("ix_portalreview_provider_id", "portalreview", ["provider_id"])

    op.create_table(
        "moderationitem",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("provider_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column("content_ref_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), server_default="PENDING_REVIEW"),
        sa.Column("flag_reason", sa.Text(), nullable=True),
        sa.Column("provider_name", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_moderationitem_id", "moderationitem", ["id"])
    op.create_index("ix_moderationitem_provider_id", "moderationitem", ["provider_id"])

    op.create_table(
        "notification",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("read", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_notification_id", "notification", ["id"])
    op.create_index("ix_notification_user_id", "notification", ["user_id"])

    op.create_table(
        "platformsetting",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(), nullable=False, unique=True),
        sa.Column("value", sa.JSON(), nullable=True),
    )
    op.create_index("ix_platformsetting_id", "platformsetting", ["id"])
    op.create_index("ix_platformsetting_key", "platformsetting", ["key"])

    op.create_table(
        "agentrunlog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("agent", sa.String(), nullable=False),
        sa.Column("task", sa.String(), nullable=True),
        sa.Column("input_params", sa.JSON(), nullable=True),
        sa.Column("tools_called", sa.JSON(), nullable=True),
        sa.Column("tool_results", sa.JSON(), nullable=True),
        sa.Column("decisions", sa.JSON(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("token_usage", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(), server_default="completed"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_agentrunlog_id", "agentrunlog", ["id"])


def downgrade() -> None:
    op.drop_table("agentrunlog")
    op.drop_table("platformsetting")
    op.drop_table("notification")
    op.drop_table("moderationitem")
    op.drop_table("portalreview")
    op.drop_table("portalpayment")
    op.drop_table("portalbooking")
    op.drop_table("providerdocument")
    op.drop_table("providerprofile")
    op.drop_column("destination", "seasonal_info")
    op.drop_column("destination", "accessibility")
    op.drop_column("destination", "historical_info")
    op.drop_column("destination", "woreda")
