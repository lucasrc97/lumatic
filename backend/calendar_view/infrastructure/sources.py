"""Adapters from each module's service to the CalendarSource contract.

Add one adapter per module with dated items and register it in `build_calendar_service`.
"""

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from calendar_view.application.services import CalendarService
from calendar_view.domain.entities import CalendarItem
from events.application.services import EventService
from events.infrastructure.repositories import SqlAlchemyEventRepository
from tasks.application.services import TaskService
from tasks.infrastructure.repositories import SqlAlchemyTaskRepository


class EventCalendarSource:
    module = "events"

    def __init__(self, service: EventService) -> None:
        self._service = service

    async def items_between(self, start: date, end: date) -> list[CalendarItem]:
        return [
            CalendarItem(
                module=self.module,
                item_id=e.id,
                title=e.title,
                day=e.event_date,
                start_time=e.start_time,
                end_time=e.end_time,
            )
            for e in await self._service.list_events(start, end)
        ]


class TaskCalendarSource:
    """Tasks appear on their due date."""

    module = "tasks"

    def __init__(self, service: TaskService) -> None:
        self._service = service

    async def items_between(self, start: date, end: date) -> list[CalendarItem]:
        return [
            CalendarItem(
                module=self.module,
                item_id=t.id,
                title=t.title,
                day=t.due_date,
                completed=t.completed_at is not None,
            )
            for t in await self._service.list_due_between(start, end)
            if t.due_date is not None
        ]


def build_calendar_service(session: AsyncSession) -> CalendarService:
    return CalendarService(
        sources=[
            EventCalendarSource(EventService(SqlAlchemyEventRepository(session))),
            TaskCalendarSource(TaskService(SqlAlchemyTaskRepository(session))),
        ]
    )
