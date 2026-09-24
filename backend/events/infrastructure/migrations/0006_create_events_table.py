"""create events table

Revision ID: 0006_events
Revises: 0005_tasks_priority
Create Date: 2026-09-24
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0006_events"
down_revision: str | None = "0005_tasks_priority"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "events_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "end_time IS NULL OR (start_time IS NOT NULL AND end_time >= start_time)",
            name="times_valid",
        ),
    )
    op.create_index("ix_events_events_event_date", "events_events", ["event_date"])


def downgrade() -> None:
    op.drop_index("ix_events_events_event_date", table_name="events_events")
    op.drop_table("events_events")
