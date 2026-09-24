from collections.abc import Iterator, Sequence
from dataclasses import replace
from datetime import UTC, date, datetime

import pytest
from fastapi.testclient import TestClient

from app.main import app
from tasks.api.routes import get_task_service
from tasks.application.services import TaskService
from tasks.domain.entities import Task, TaskColumn, TaskPriority

# Same starting columns as the 0004 migration.
TODO, DOING, DONE = 1, 2, 3


class InMemoryTaskRepository:
    """Test double implementing the TaskRepository contract."""

    def __init__(self) -> None:
        self.columns: dict[int, TaskColumn] = {
            TODO: TaskColumn(TODO, "A fazer", "#94a3b8", 0, False),
            DOING: TaskColumn(DOING, "Em andamento", "#3b82f6", 1, False),
            DONE: TaskColumn(DONE, "Concluída", "#22c55e", 2, True),
        }
        self.tasks: dict[int, Task] = {}
        self._next_id = 100

    def _new_id(self) -> int:
        self._next_id += 1
        return self._next_id

    # Columns

    async def list_columns(self) -> list[TaskColumn]:
        return sorted(self.columns.values(), key=lambda c: (c.position, c.id))

    async def get_column(self, column_id: int) -> TaskColumn | None:
        return self.columns.get(column_id)

    async def add_column(self, name: str, color: str, position: int) -> TaskColumn:
        column = TaskColumn(self._new_id(), name, color, position, False)
        self.columns[column.id] = column
        return column

    async def save_column(self, column: TaskColumn) -> TaskColumn:
        stored = self.columns[column.id]
        self.columns[column.id] = replace(stored, name=column.name, color=column.color)
        return self.columns[column.id]

    async def set_done_column(self, column_id: int, now: datetime) -> None:
        for column in list(self.columns.values()):
            self.columns[column.id] = replace(column, is_done=column.id == column_id)
        for task in list(self.tasks.values()):
            completed_at = (task.completed_at or now) if task.column_id == column_id else None
            self.tasks[task.id] = replace(task, completed_at=completed_at)

    async def set_column_positions(self, column_ids: Sequence[int]) -> None:
        for position, column_id in enumerate(column_ids):
            self.columns[column_id] = replace(self.columns[column_id], position=position)

    async def delete_column(
        self, column_id: int, move_tasks_to: int, completed_at: datetime | None
    ) -> None:
        for task in list(self.tasks.values()):
            if task.column_id == column_id:
                self.tasks[task.id] = replace(
                    task, column_id=move_tasks_to, completed_at=completed_at
                )
        del self.columns[column_id]

    # Tasks

    async def list_tasks(self) -> list[Task]:
        active = [t for t in self.tasks.values() if t.deleted_at is None]
        return sorted(
            active, key=lambda t: (t.due_date is None, t.due_date or date.min, t.created_at, t.id)
        )

    async def list_due_between(self, start: date, end: date) -> list[Task]:
        return [
            t
            for t in await self.list_tasks()
            if t.due_date is not None and start <= t.due_date <= end
        ]

    async def list_in_column(self, column_id: int) -> list[Task]:
        return [t for t in self.tasks.values() if t.column_id == column_id]

    async def get(self, task_id: int) -> Task | None:
        return self.tasks.get(task_id)

    async def add(
        self,
        title: str,
        description: str | None,
        due_date: date | None,
        column_id: int,
        priority: TaskPriority,
        completed_at: datetime | None,
    ) -> Task:
        task = Task(
            id=self._new_id(),
            title=title,
            description=description,
            due_date=due_date,
            column_id=column_id,
            created_at=datetime(2026, 1, 1, tzinfo=UTC),
            priority=priority,
            completed_at=completed_at,
        )
        self.tasks[task.id] = task
        return task

    async def save(self, task: Task) -> Task:
        self.tasks[task.id] = task
        return task

    async def list_deleted(self) -> list[Task]:
        deleted = [t for t in self.tasks.values() if t.deleted_at is not None]
        return sorted(deleted, key=lambda t: (t.deleted_at, -t.id), reverse=True)

    async def purge(self, task_id: int) -> None:
        self.tasks.pop(task_id, None)

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        expired = [
            t.id for t in self.tasks.values() if t.deleted_at is not None and t.deleted_at < cutoff
        ]
        for task_id in expired:
            del self.tasks[task_id]
        return len(expired)


@pytest.fixture
def repository() -> InMemoryTaskRepository:
    return InMemoryTaskRepository()


@pytest.fixture
def service(repository: InMemoryTaskRepository) -> TaskService:
    return TaskService(repository)


@pytest.fixture
def client(service: TaskService) -> Iterator[TestClient]:
    app.dependency_overrides[get_task_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
