from collections.abc import Mapping, Sequence
from datetime import date, datetime
from typing import Protocol

from tasks.domain.entities import CustomValue, FieldType, Task, TaskColumn, TaskField


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

    # Fields

    async def list_fields(self) -> list[TaskField]:
        """All fields ordered by position."""
        ...

    async def get_field(self, field_id: int) -> TaskField | None: ...

    async def add_field(
        self, name: str, type_: FieldType, options: Sequence[str], position: int
    ) -> TaskField: ...

    async def save_field(self, field: TaskField) -> TaskField:
        """Saves name and options; the type never changes.

        For select fields, task values that are no longer an option are removed in the same
        transaction.
        """
        ...

    async def set_field_positions(self, field_ids: Sequence[int]) -> None:
        """Order fields as listed; every field id must be present."""
        ...

    async def delete_field(self, field_id: int) -> None:
        """Delete a field and its value in every task, trashed ones included."""
        ...

    # Tasks

    async def list_tasks(self) -> list[Task]:
        """Tasks that are not in the trash, by due date (undated last), then creation."""
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
        custom_values: Mapping[int, CustomValue],
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
