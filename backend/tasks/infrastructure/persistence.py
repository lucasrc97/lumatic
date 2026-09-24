from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    false,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class TaskColumnModel(Base):
    __tablename__ = "tasks_columns"
    __table_args__ = (
        # At most one done column; the service keeps it at exactly one.
        Index(
            "uq_tasks_columns_single_done",
            "is_done",
            unique=True,
            postgresql_where=text("is_done"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    color: Mapped[str] = mapped_column(String(7))
    position: Mapped[int]
    is_done: Mapped[bool] = mapped_column(default=False, server_default=false())


class TaskFieldModel(Base):
    __tablename__ = "tasks_fields"
    __table_args__ = (
        CheckConstraint("type IN ('text', 'number', 'date', 'select')", name="type_valid"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    # A plain string with a CHECK instead of a PostgreSQL ENUM, which is awkward to migrate.
    type: Mapped[str] = mapped_column(String(10))
    options: Mapped[list[str]] = mapped_column(JSONB, default=list, server_default="[]")
    position: Mapped[int]


class TaskModel(Base):
    __tablename__ = "tasks_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(String(2000))
    due_date: Mapped[date | None] = mapped_column(Date, index=True)
    # RESTRICT: the service moves remaining tasks before deleting a column.
    column_id: Mapped[int] = mapped_column(
        ForeignKey("tasks_columns.id", ondelete="RESTRICT"), index=True
    )
    # {"<field id>": value}; JSON object keys are always strings.
    custom_values: Mapped[dict[str, Any]] = mapped_column(
        JSONB, default=dict, server_default="{}"
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
