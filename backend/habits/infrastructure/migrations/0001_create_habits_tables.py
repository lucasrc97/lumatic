"""create habits tables

Revision ID: 0001_habits
Revises:
Create Date: 2026-09-24
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0001_habits"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "habits_habits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("color", sa.String(length=7), nullable=False),
        sa.Column("archived", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_table(
        "habits_entries",
        sa.Column(
            "habit_id",
            sa.Integer(),
            sa.ForeignKey("habits_habits.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("entry_date", sa.Date(), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("habits_entries")
    op.drop_table("habits_habits")
