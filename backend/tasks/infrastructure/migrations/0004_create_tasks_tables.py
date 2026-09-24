"""create tasks tables

Revision ID: 0004_tasks
Revises: 0003_preferences
Create Date: 2026-09-24
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004_tasks"
down_revision: str | None = "0003_preferences"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    columns = op.create_table(
        "tasks_columns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("color", sa.String(length=7), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("is_done", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.create_index(
        "uq_tasks_columns_single_done",
        "tasks_columns",
        ["is_done"],
        unique=True,
        postgresql_where=sa.text("is_done"),
    )
    # Starting columns; their names are user data (not translated) and can be renamed.
    op.bulk_insert(
        columns,
        [
            {"name": "A fazer", "color": "#94a3b8", "position": 0, "is_done": False},
            {"name": "Em andamento", "color": "#3b82f6", "position": 1, "is_done": False},
            {"name": "Concluída", "color": "#22c55e", "position": 2, "is_done": True},
        ],
    )

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

    op.create_table(
        "tasks_tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column(
            "column_id",
            sa.Integer(),
            sa.ForeignKey("tasks_columns.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "custom_values",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_tasks_tasks_due_date", "tasks_tasks", ["due_date"])
    op.create_index("ix_tasks_tasks_column_id", "tasks_tasks", ["column_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_tasks_column_id", table_name="tasks_tasks")
    op.drop_index("ix_tasks_tasks_due_date", table_name="tasks_tasks")
    op.drop_table("tasks_tasks")
    op.drop_table("tasks_fields")
    op.drop_index("uq_tasks_columns_single_done", table_name="tasks_columns")
    op.drop_table("tasks_columns")
