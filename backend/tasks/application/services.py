from collections.abc import Mapping, Sequence
from dataclasses import replace
from datetime import datetime

from tasks.application.dtos import (
    ColumnCreate,
    ColumnRead,
    ColumnUpdate,
    CustomValueInput,
    FieldCreate,
    FieldRead,
    FieldUpdate,
    TaskCreate,
    TaskRead,
    TaskUpdate,
    TrashedTask,
)
from tasks.domain.entities import (
    CustomValue,
    Task,
    TaskColumn,
    TaskField,
    completed_at_for,
    normalize_options,
    validate_custom_value,
)
from tasks.domain.exceptions import (
    DoneColumnRequiredError,
    InvalidOrderError,
    TaskColumnNotEmptyError,
    TaskColumnNotFoundError,
    TaskFieldNotFoundError,
    TaskNotFoundError,
    UnknownCustomFieldError,
)
from tasks.domain.repositories import TaskRepository


class TaskService:
    def __init__(self, repository: TaskRepository) -> None:
        self._repository = repository

    # Tasks

    async def list_tasks(self) -> list[TaskRead]:
        return [TaskRead.from_entity(task) for task in await self._repository.list_tasks()]

    async def create_task(self, data: TaskCreate, now: datetime) -> TaskRead:
        column = await self._column_for_new_task(data.column_id)
        task = await self._repository.add(
            title=data.title,
            description=data.description,
            due_date=data.due_date,
            column_id=column.id,
            custom_values=await self._merge_custom_values({}, data.custom_values),
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
        )
        if data.column_id is not None and data.column_id != task.column_id:
            column = await self._get_column(data.column_id)
            updated = replace(
                updated,
                column_id=column.id,
                completed_at=completed_at_for(column, task.completed_at, now),
            )
        if data.custom_values is not None:
            updated = replace(
                updated,
                custom_values=await self._merge_custom_values(
                    task.custom_values, data.custom_values
                ),
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
        _check_order(column_ids, [c.id for c in columns])
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

    # Fields

    async def list_fields(self) -> list[FieldRead]:
        return [FieldRead.from_entity(f) for f in await self._repository.list_fields()]

    async def create_field(self, data: FieldCreate) -> FieldRead:
        options = normalize_options(data.type, data.options)
        fields = await self._repository.list_fields()
        position = max((f.position for f in fields), default=-1) + 1
        field = await self._repository.add_field(data.name, data.type, options, position)
        return FieldRead.from_entity(field)

    async def update_field(self, field_id: int, data: FieldUpdate) -> FieldRead:
        field = await self._get_field(field_id)
        if data.name is not None:
            field = replace(field, name=data.name)
        if data.options is not None:
            field = replace(field, options=normalize_options(field.type, data.options))
        saved = await self._repository.save_field(field)
        return FieldRead.from_entity(saved)

    async def reorder_fields(self, field_ids: Sequence[int]) -> list[FieldRead]:
        fields = await self._repository.list_fields()
        _check_order(field_ids, [f.id for f in fields])
        await self._repository.set_field_positions(field_ids)
        return await self.list_fields()

    async def delete_field(self, field_id: int) -> None:
        """Delete a field and its value in every task."""
        await self._get_field(field_id)
        await self._repository.delete_field(field_id)

    # Helpers

    async def _merge_custom_values(
        self,
        current: Mapping[int, CustomValue],
        updates: Mapping[int, CustomValueInput],
    ) -> dict[int, CustomValue]:
        if not updates:
            return dict(current)
        fields = {f.id: f for f in await self._repository.list_fields()}
        merged = dict(current)
        for field_id, raw in updates.items():
            field = fields.get(field_id)
            if field is None:
                raise UnknownCustomFieldError(field_id)
            value = validate_custom_value(field, raw)
            if value is None:
                merged.pop(field_id, None)
            else:
                merged[field_id] = value
        return merged

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

    async def _get_field(self, field_id: int) -> TaskField:
        field = await self._repository.get_field(field_id)
        if field is None:
            raise TaskFieldNotFoundError(field_id)
        return field

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


def _check_order(ordered_ids: Sequence[int], existing_ids: Sequence[int]) -> None:
    if len(ordered_ids) != len(existing_ids) or set(ordered_ids) != set(existing_ids):
        raise InvalidOrderError()
