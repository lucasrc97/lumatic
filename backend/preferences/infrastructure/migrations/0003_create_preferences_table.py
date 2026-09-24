"""create preferences table

Revision ID: 0003_preferences
Revises: 0002_habits_soft_delete
Create Date: 2026-09-24
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0003_preferences"
down_revision: str | None = "0002_habits_soft_delete"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "preferences_preferences",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=False),
        sa.Column("trash_retention_days", sa.Integer(), server_default="30", nullable=False),
        sa.CheckConstraint("id = 1", name="single_row"),
        sa.CheckConstraint(
            "trash_retention_days BETWEEN 1 AND 365", name="trash_retention_days_range"
        ),
    )


def downgrade() -> None:
    op.drop_table("preferences_preferences")
