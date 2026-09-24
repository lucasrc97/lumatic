from collections.abc import Sequence
from datetime import date, datetime

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from tasks.domain.entities import Task, TaskColumn, TaskPriority
from tasks.infrastructure.persistence import TaskColumnModel, TaskModel


def _column_to_entity(model: TaskColumnModel) -> TaskColumn:
    return TaskColumn(
        id=model.id,
        name=model.name,
        color=model.color,
        position=model.position,
        is_done=model.is_done,
    )


def _task_to_entity(model: TaskModel) -> Task:
    return Task(
        id=model.id,
        title=model.title,
        description=model.description,
        due_date=model.due_date,
        column_id=model.column_id,
        created_at=model.created_at,
        priority=TaskPriority(model.priority),
        completed_at=model.completed_at,
        deleted_at=model.deleted_at,
    )


class SqlAlchemyTaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # Columns

    async def list_columns(self) -> list[TaskColumn]:
        result = await self._session.scalars(
            select(TaskColumnModel).order_by(TaskColumnModel.position, TaskColumnModel.id)
        )
        return [_column_to_entity(model) for model in result]

    async def get_column(self, column_id: int) -> TaskColumn | None:
        model = await self._session.get(TaskColumnModel, column_id)
        return _column_to_entity(model) if model is not None else None

    async def add_column(self, name: str, color: str, position: int) -> TaskColumn:
        model = TaskColumnModel(name=name, color=color, position=position, is_done=False)
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return _column_to_entity(model)

    async def save_column(self, column: TaskColumn) -> TaskColumn:
        model = await self._session.get_one(TaskColumnModel, column.id)
        model.name = column.name
        model.color = column.color
        await self._session.commit()
        return _column_to_entity(model)

    async def set_done_column(self, column_id: int, now: datetime) -> None:
        previous_ids = list(
            await self._session.scalars(
                select(TaskColumnModel.id).where(
                    TaskColumnModel.is_done.is_(True), TaskColumnModel.id != column_id
                )
            )
        )
        # Clear the old flag first: the partial unique index allows a single done column.
        await self._session.execute(
            update(TaskColumnModel)
            .where(TaskColumnModel.id.in_(previous_ids))
            .values(is_done=False)
        )
        await self._session.execute(
            update(TaskColumnModel).where(TaskColumnModel.id == column_id).values(is_done=True)
        )
        await self._session.execute(
            update(TaskModel)
            .where(TaskModel.column_id.in_(previous_ids))
            .values(completed_at=None)
        )
        await self._session.execute(
            update(TaskModel)
            .where(TaskModel.column_id == column_id)
            .values(completed_at=func.coalesce(TaskModel.completed_at, now)),
            execution_options={"synchronize_session": "fetch"},
        )
        await self._session.commit()

    async def set_column_positions(self, column_ids: Sequence[int]) -> None:
        for position, column_id in enumerate(column_ids):
            await self._session.execute(
                update(TaskColumnModel)
                .where(TaskColumnModel.id == column_id)
                .values(position=position)
            )
        await self._session.commit()

    async def delete_column(
        self, column_id: int, move_tasks_to: int, completed_at: datetime | None
    ) -> None:
        await self._session.execute(
            update(TaskModel)
            .where(TaskModel.column_id == column_id)
            .values(column_id=move_tasks_to, completed_at=completed_at)
        )
        await self._session.execute(delete(TaskColumnModel).where(TaskColumnModel.id == column_id))
        await self._session.commit()

    # Tasks

    async def list_tasks(self) -> list[Task]:
        result = await self._session.scalars(
            select(TaskModel)
            .where(TaskModel.deleted_at.is_(None))
            .order_by(
                TaskModel.due_date.asc().nulls_last(), TaskModel.created_at, TaskModel.id
            )
        )
        return [_task_to_entity(model) for model in result]

    async def list_due_between(self, start: date, end: date) -> list[Task]:
        result = await self._session.scalars(
            select(TaskModel)
            .where(
                TaskModel.deleted_at.is_(None),
                TaskModel.due_date >= start,
                TaskModel.due_date <= end,
            )
            .order_by(TaskModel.due_date, TaskModel.created_at, TaskModel.id)
        )
        return [_task_to_entity(model) for model in result]

    async def list_in_column(self, column_id: int) -> list[Task]:
        result = await self._session.scalars(
            select(TaskModel).where(TaskModel.column_id == column_id).order_by(TaskModel.id)
        )
        return [_task_to_entity(model) for model in result]

    async def get(self, task_id: int) -> Task | None:
        model = await self._session.get(TaskModel, task_id)
        return _task_to_entity(model) if model is not None else None

    async def add(
        self,
        title: str,
        description: str | None,
        due_date: date | None,
        column_id: int,
        priority: TaskPriority,
        completed_at: datetime | None,
    ) -> Task:
        model = TaskModel(
            title=title,
            description=description,
            due_date=due_date,
            column_id=column_id,
            priority=priority.value,
            completed_at=completed_at,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return _task_to_entity(model)

    async def save(self, task: Task) -> Task:
        model = await self._session.get_one(TaskModel, task.id)
        model.title = task.title
        model.description = task.description
        model.due_date = task.due_date
        model.column_id = task.column_id
        model.priority = task.priority.value
        model.completed_at = task.completed_at
        model.deleted_at = task.deleted_at
        await self._session.commit()
        return _task_to_entity(model)

    async def list_deleted(self) -> list[Task]:
        result = await self._session.scalars(
            select(TaskModel)
            .where(TaskModel.deleted_at.is_not(None))
            .order_by(TaskModel.deleted_at.desc(), TaskModel.id)
        )
        return [_task_to_entity(model) for model in result]

    async def purge(self, task_id: int) -> None:
        await self._session.execute(delete(TaskModel).where(TaskModel.id == task_id))
        await self._session.commit()

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        result = await self._session.execute(
            delete(TaskModel).where(TaskModel.deleted_at < cutoff).returning(TaskModel.id)
        )
        await self._session.commit()
        return len(result.all())
