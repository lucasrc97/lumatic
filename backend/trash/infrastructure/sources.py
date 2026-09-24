"""Adapters from each module's service to the TrashSource contract.

Add one adapter per module with deletable items and register it in `build_trash_service`.
"""

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from events.application.services import EventService
from events.infrastructure.repositories import SqlAlchemyEventRepository
from habits.application.services import HabitService
from habits.infrastructure.repositories import SqlAlchemyHabitRepository
from preferences.application.services import PreferencesService
from preferences.infrastructure.repositories import SqlAlchemyPreferencesRepository
from tasks.application.services import TaskService
from tasks.infrastructure.repositories import SqlAlchemyTaskRepository
from trash.application.services import TrashService
from trash.domain.entities import TrashItem


class HabitTrashSource:
    module = "habits"

    def __init__(self, service: HabitService) -> None:
        self._service = service

    async def list_items(self) -> list[TrashItem]:
        return [
            TrashItem(module=self.module, item_id=h.id, title=h.name, deleted_at=h.deleted_at)
            for h in await self._service.list_trashed()
        ]

    async def restore(self, item_id: int) -> None:
        await self._service.restore_habit(item_id)

    async def purge(self, item_id: int) -> None:
        await self._service.purge_habit(item_id)

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        return await self._service.purge_trashed_before(cutoff)


class TaskTrashSource:
    module = "tasks"

    def __init__(self, service: TaskService) -> None:
        self._service = service

    async def list_items(self) -> list[TrashItem]:
        return [
            TrashItem(module=self.module, item_id=t.id, title=t.title, deleted_at=t.deleted_at)
            for t in await self._service.list_trashed()
        ]

    async def restore(self, item_id: int) -> None:
        await self._service.restore_task(item_id)

    async def purge(self, item_id: int) -> None:
        await self._service.purge_task(item_id)

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        return await self._service.purge_trashed_before(cutoff)


class EventTrashSource:
    module = "events"

    def __init__(self, service: EventService) -> None:
        self._service = service

    async def list_items(self) -> list[TrashItem]:
        return [
            TrashItem(module=self.module, item_id=e.id, title=e.title, deleted_at=e.deleted_at)
            for e in await self._service.list_trashed()
        ]

    async def restore(self, item_id: int) -> None:
        await self._service.restore_event(item_id)

    async def purge(self, item_id: int) -> None:
        await self._service.purge_event(item_id)

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        return await self._service.purge_trashed_before(cutoff)


def build_trash_service(session: AsyncSession) -> TrashService:
    return TrashService(
        sources=[
            HabitTrashSource(HabitService(SqlAlchemyHabitRepository(session))),
            TaskTrashSource(TaskService(SqlAlchemyTaskRepository(session))),
            EventTrashSource(EventService(SqlAlchemyEventRepository(session))),
        ],
        preferences=PreferencesService(SqlAlchemyPreferencesRepository(session)),
    )
