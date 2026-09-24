from dataclasses import dataclass
from datetime import date, datetime
from enum import StrEnum


class TaskPriority(StrEnum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass(frozen=True)
class TaskColumn:
    """A Kanban column. Exactly one column is the "done" column."""

    id: int
    name: str
    color: str
    position: int
    is_done: bool


@dataclass(frozen=True)
class Task:
    """A task in one column.

    `completed_at` is set while the task sits in the done column. A task with
    `deleted_at` set is in the trash: hidden everywhere until restored or purged.
    """

    id: int
    title: str
    description: str | None
    due_date: date | None
    column_id: int
    created_at: datetime
    priority: TaskPriority = TaskPriority.NONE
    completed_at: datetime | None = None
    deleted_at: datetime | None = None


def completed_at_for(
    column: TaskColumn, previous: datetime | None, now: datetime
) -> datetime | None:
    """Completion time for a task in `column`: set on entering done, kept, cleared on leaving."""
    if not column.is_done:
        return None
    return previous or now
