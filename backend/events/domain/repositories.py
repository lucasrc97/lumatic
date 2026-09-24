from datetime import date, datetime, time
from typing import Protocol

from events.domain.entities import Event


class EventRepository(Protocol):
    async def list_between(self, start: date, end: date) -> list[Event]:
        """Events not in the trash within [start, end], by date, all-day first, then time."""
        ...

    async def get(self, event_id: int) -> Event | None:
        """Any event by id, including one in the trash."""
        ...

    async def add(
        self,
        title: str,
        description: str | None,
        event_date: date,
        start_time: time | None,
        end_time: time | None,
    ) -> Event: ...

    async def save(self, event: Event) -> Event: ...

    async def list_deleted(self) -> list[Event]:
        """Events in the trash, most recently deleted first."""
        ...

    async def purge(self, event_id: int) -> None:
        """Permanently delete an event."""
        ...

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        """Permanently delete events trashed before `cutoff`; returns how many were deleted."""
        ...
