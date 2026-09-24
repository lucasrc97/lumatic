from collections.abc import Iterator
from datetime import UTC, date, datetime, time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from events.api.routes import get_event_service
from events.application.services import EventService
from events.domain.entities import Event


class InMemoryEventRepository:
    """Test double implementing the EventRepository contract."""

    def __init__(self) -> None:
        self.events: dict[int, Event] = {}
        self._next_id = 1

    async def list_between(self, start: date, end: date) -> list[Event]:
        active = [
            e
            for e in self.events.values()
            if e.deleted_at is None and start <= e.event_date <= end
        ]
        return sorted(
            active,
            key=lambda e: (e.event_date, e.start_time is not None, e.start_time or time(), e.id),
        )

    async def get(self, event_id: int) -> Event | None:
        return self.events.get(event_id)

    async def add(
        self,
        title: str,
        description: str | None,
        event_date: date,
        start_time: time | None,
        end_time: time | None,
    ) -> Event:
        event = Event(
            id=self._next_id,
            title=title,
            description=description,
            event_date=event_date,
            start_time=start_time,
            end_time=end_time,
            created_at=datetime(2026, 1, 1, tzinfo=UTC),
        )
        self.events[event.id] = event
        self._next_id += 1
        return event

    async def save(self, event: Event) -> Event:
        self.events[event.id] = event
        return event

    async def list_deleted(self) -> list[Event]:
        deleted = [e for e in self.events.values() if e.deleted_at is not None]
        return sorted(deleted, key=lambda e: (e.deleted_at, -e.id), reverse=True)

    async def purge(self, event_id: int) -> None:
        self.events.pop(event_id, None)

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        expired = [
            e.id
            for e in self.events.values()
            if e.deleted_at is not None and e.deleted_at < cutoff
        ]
        for event_id in expired:
            del self.events[event_id]
        return len(expired)


@pytest.fixture
def repository() -> InMemoryEventRepository:
    return InMemoryEventRepository()


@pytest.fixture
def service(repository: InMemoryEventRepository) -> EventService:
    return EventService(repository)


@pytest.fixture
def client(service: EventService) -> Iterator[TestClient]:
    app.dependency_overrides[get_event_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
