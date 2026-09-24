from collections.abc import Sequence
from datetime import date, datetime
from typing import Protocol

from tasks.domain.entities import Task, TaskColumn, TaskPriority


class TaskRepository(Protocol):
    # Columns

    async def list_columns(self) -> list[TaskColumn]:
        """All columns ordered by position."""
        ...

    async def get_column(self, column_id: int) -> TaskColumn | None: ...

    async def add_column(self, name: str, color: str, position: int) -> TaskColumn:
        """Adds a column that is not the done column."""
        ...

    async def save_column(self, column: TaskColumn) -> TaskColumn:
        """Saves name and color; use `set_done_column` and `set_column_positions` for the rest."""
        ...

    async def set_done_column(self, column_id: int, now: datetime) -> None:
        """Atomically make `column_id` the only done column.

        Tasks leaving done lose `completed_at`; tasks in the new done column without one get `now`.
        """
        ...

    async def set_column_positions(self, column_ids: Sequence[int]) -> None:
        """Order columns as listed; every column id must be present."""
        ...

    async def delete_column(
        self, column_id: int, move_tasks_to: int, completed_at: datetime | None
    ) -> None:
        """Atomically move the column's remaining tasks (setting `completed_at`) and delete it."""
        ...

    # Tasks

    async def list_tasks(self) -> list[Task]:
        """Tasks that are not in the trash, by due date (undated last), then creation."""
        ...

    async def list_due_between(self, start: date, end: date) -> list[Task]:
        """Tasks not in the trash due within [start, end], by due date then creation."""
        ...

    async def list_in_column(self, column_id: int) -> list[Task]:
        """Every task in the column, trashed ones included."""
        ...

    async def get(self, task_id: int) -> Task | None:
        """Any task by id, including one in the trash."""
        ...

    async def add(
        self,
        title: str,
        description: str | None,
        due_date: date | None,
        column_id: int,
        priority: TaskPriority,
        completed_at: datetime | None,
    ) -> Task: ...

    async def save(self, task: Task) -> Task: ...

    async def list_deleted(self) -> list[Task]:
        """Tasks in the trash, most recently deleted first."""
        ...

    async def purge(self, task_id: int) -> None:
        """Permanently delete a task."""
        ...

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        """Permanently delete tasks trashed before `cutoff`; returns how many were deleted."""
        ...
