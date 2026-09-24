"""replace user-defined task fields with a fixed priority

Revision ID: 0005_tasks_priority
Revises: 0004_tasks
Create Date: 2026-09-24

Custom fields were removed from the product: their definitions and values are dropped.
Downgrade recreates the empty structures; dropped values cannot be recovered.
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0005_tasks_priority"
down_revision: str | None = "0004_tasks"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tasks_tasks",
        sa.Column("priority", sa.String(length=10), server_default="none", nullable=False),
    )
    op.create_check_constraint(
        "priority_valid", "tasks_tasks", "priority IN ('none', 'low', 'medium', 'high')"
    )
    op.drop_column("tasks_tasks", "custom_values")
    op.drop_table("tasks_fields")


def downgrade() -> None:
    op.create_table(
        "tasks_fields",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("type", sa.String(length=10), nullable=False),
        sa.Column(
            "options",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.CheckConstraint("type IN ('text', 'number', 'date', 'select')", name="type_valid"),
    )
    op.add_column(
        "tasks_tasks",
        sa.Column(
            "custom_values",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
    )
    op.drop_constraint("priority_valid", "tasks_tasks", type_="check")
    op.drop_column("tasks_tasks", "priority")
