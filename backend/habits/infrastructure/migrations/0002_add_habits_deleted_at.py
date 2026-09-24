"""add habits deleted_at for the trash

Revision ID: 0002_habits_soft_delete
Revises: 0001_habits
Create Date: 2026-09-24
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0002_habits_soft_delete"
down_revision: str | None = "0001_habits"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "habits_habits", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("habits_habits", "deleted_at")
