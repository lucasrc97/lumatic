from collections.abc import Sequence
from dataclasses import replace
from datetime import date, datetime

from tasks.application.dtos import (
    ColumnCreate,
    ColumnRead,
    ColumnUpdate,
    TaskCreate,
    TaskRead,
    TaskUpdate,
    TrashedTask,
)
from tasks.domain.entities import Task, TaskColumn, completed_at_for
from tasks.domain.exceptions import (
    DoneColumnRequiredError,
    InvalidDateRangeError,
    InvalidOrderError,
    TaskColumnNotEmptyError,
    TaskColumnNotFoundError,
    TaskNotFoundError,
)
from tasks.domain.repositories import TaskRepository

MAX_RANGE_DAYS = 366


class TaskService:
    def __init__(self, repository: TaskRepository) -> None:
        self._repository = repository

    # Tasks

    async def list_tasks(self) -> list[TaskRead]:
        return [TaskRead.from_entity(task) for task in await self._repository.list_tasks()]

    async def list_due_between(self, start: date, end: date) -> list[TaskRead]:
        """Active tasks due within [start, end]; used by the calendar view."""
        if start > end:
            raise InvalidDateRangeError("'from' must be on or before 'to'.")
        if (end - start).days >= MAX_RANGE_DAYS:
            raise InvalidDateRangeError(f"Date range cannot exceed {MAX_RANGE_DAYS} days.")
        return [
            TaskRead.from_entity(task)
            for task in await self._repository.list_due_between(start, end)
        ]

    async def create_task(self, data: TaskCreate, now: datetime) -> TaskRead:
        column = await self._column_for_new_task(data.column_id)
        task = await self._repository.add(
            title=data.title,
            description=data.description,
            due_date=data.due_date,
            column_id=column.id,
            priority=data.priority,
            completed_at=completed_at_for(column, None, now),
        )
        return TaskRead.from_entity(task)

    async def update_task(self, task_id: int, data: TaskUpdate, now: datetime) -> TaskRead:
        task = await self._get_task(task_id)
        provided = data.model_fields_set
        updated = replace(
            task,
            title=data.title if data.title is not None else task.title,
            description=data.description if "description" in provided else task.description,
            due_date=data.due_date if "due_date" in provided else task.due_date,
            priority=data.priority if data.priority is not None else task.priority,
        )
        if data.column_id is not None and data.column_id != task.column_id:
            column = await self._get_column(data.column_id)
            updated = replace(
                updated,
                column_id=column.id,
                completed_at=completed_at_for(column, task.completed_at, now),
            )
        if updated == task:
            return TaskRead.from_entity(task)
        return TaskRead.from_entity(await self._repository.save(updated))

    async def delete_task(self, task_id: int, now: datetime) -> None:
        """Move a task to the trash; it can be restored until purged."""
        task = await self._get_task(task_id)
        await self._repository.save(replace(task, deleted_at=now))

    async def list_trashed(self) -> list[TrashedTask]:
        return [TrashedTask.from_entity(t) for t in await self._repository.list_deleted()]

    async def restore_task(self, task_id: int) -> None:
        task = await self._get_trashed_task(task_id)
        await self._repository.save(replace(task, deleted_at=None))

    async def purge_task(self, task_id: int) -> None:
        await self._get_trashed_task(task_id)
        await self._repository.purge(task_id)

    async def purge_trashed_before(self, cutoff: datetime) -> int:
        return await self._repository.purge_deleted_before(cutoff)

    # Columns

    async def list_columns(self) -> list[ColumnRead]:
        return [ColumnRead.from_entity(c) for c in await self._repository.list_columns()]

    async def create_column(self, data: ColumnCreate) -> ColumnRead:
        columns = await self._repository.list_columns()
        position = max((c.position for c in columns), default=-1) + 1
        column = await self._repository.add_column(data.name, data.color, position)
        return ColumnRead.from_entity(column)

    async def update_column(self, column_id: int, data: ColumnUpdate, now: datetime) -> ColumnRead:
        column = await self._get_column(column_id)
        if data.is_done is False and column.is_done:
            raise DoneColumnRequiredError()
        renamed = replace(
            column,
            name=data.name if data.name is not None else column.name,
            color=data.color if data.color is not None else column.color,
        )
        if renamed != column:
            column = await self._repository.save_column(renamed)
        if data.is_done and not column.is_done:
            await self._repository.set_done_column(column.id, now)
            column = replace(column, is_done=True)
        return ColumnRead.from_entity(column)

    async def reorder_columns(self, column_ids: Sequence[int]) -> list[ColumnRead]:
        columns = await self._repository.list_columns()
        existing = [c.id for c in columns]
        if len(column_ids) != len(existing) or set(column_ids) != set(existing):
            raise InvalidOrderError()
        await self._repository.set_column_positions(column_ids)
        return await self.list_columns()

    async def delete_column(self, column_id: int, now: datetime) -> None:
        """Delete an empty column that is not the done column.

        Trashed tasks still in it move to the first remaining column, so they can be restored.
        """
        column = await self._get_column(column_id)
        if column.is_done:
            raise DoneColumnRequiredError()
        tasks = await self._repository.list_in_column(column_id)
        if any(task.deleted_at is None for task in tasks):
            raise TaskColumnNotEmptyError(column_id)
        # The done column always remains, so there is always a fallback.
        fallback = next(c for c in await self._repository.list_columns() if c.id != column_id)
        await self._repository.delete_column(
            column_id,
            move_tasks_to=fallback.id,
            completed_at=completed_at_for(fallback, None, now),
        )

    # Helpers

    async def _column_for_new_task(self, column_id: int | None) -> TaskColumn:
        if column_id is not None:
            return await self._get_column(column_id)
        # The done column always exists, so there is at least one column.
        return (await self._repository.list_columns())[0]

    async def _get_column(self, column_id: int) -> TaskColumn:
        column = await self._repository.get_column(column_id)
        if column is None:
            raise TaskColumnNotFoundError(column_id)
        return column

    async def _get_task(self, task_id: int) -> Task:
        """A task that is not in the trash; trashed tasks behave as if they do not exist."""
        task = await self._repository.get(task_id)
        if task is None or task.deleted_at is not None:
            raise TaskNotFoundError(task_id)
        return task

    async def _get_trashed_task(self, task_id: int) -> Task:
        task = await self._repository.get(task_id)
        if task is None or task.deleted_at is None:
            raise TaskNotFoundError(task_id)
        return task
