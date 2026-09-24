from dataclasses import replace
from datetime import date, datetime

from events.application.dtos import EventCreate, EventRead, EventUpdate, TrashedEvent
from events.domain.entities import Event, check_times
from events.domain.exceptions import EventNotFoundError, InvalidDateRangeError
from events.domain.repositories import EventRepository

MAX_RANGE_DAYS = 366


class EventService:
    def __init__(self, repository: EventRepository) -> None:
        self._repository = repository

    async def list_events(self, start: date, end: date) -> list[EventRead]:
        if start > end:
            raise InvalidDateRangeError("'from' must be on or before 'to'.")
        if (end - start).days >= MAX_RANGE_DAYS:
            raise InvalidDateRangeError(f"Date range cannot exceed {MAX_RANGE_DAYS} days.")
        return [EventRead.from_entity(e) for e in await self._repository.list_between(start, end)]

    async def create_event(self, data: EventCreate) -> EventRead:
        check_times(data.start_time, data.end_time)
        event = await self._repository.add(
            title=data.title,
            description=data.description,
            event_date=data.event_date,
            start_time=data.start_time,
            end_time=data.end_time,
        )
        return EventRead.from_entity(event)

    async def update_event(self, event_id: int, data: EventUpdate) -> EventRead:
        event = await self._get_event(event_id)
        provided = data.model_fields_set
        updated = replace(
            event,
            title=data.title if data.title is not None else event.title,
            description=data.description if "description" in provided else event.description,
            event_date=data.event_date if data.event_date is not None else event.event_date,
            start_time=data.start_time if "start_time" in provided else event.start_time,
            end_time=data.end_time if "end_time" in provided else event.end_time,
        )
        check_times(updated.start_time, updated.end_time)
        if updated == event:
            return EventRead.from_entity(event)
        return EventRead.from_entity(await self._repository.save(updated))

    async def delete_event(self, event_id: int, now: datetime) -> None:
        """Move an event to the trash; it can be restored until purged."""
        event = await self._get_event(event_id)
        await self._repository.save(replace(event, deleted_at=now))

    async def list_trashed(self) -> list[TrashedEvent]:
        return [TrashedEvent.from_entity(e) for e in await self._repository.list_deleted()]

    async def restore_event(self, event_id: int) -> None:
        event = await self._get_trashed_event(event_id)
        await self._repository.save(replace(event, deleted_at=None))

    async def purge_event(self, event_id: int) -> None:
        await self._get_trashed_event(event_id)
        await self._repository.purge(event_id)

    async def purge_trashed_before(self, cutoff: datetime) -> int:
        return await self._repository.purge_deleted_before(cutoff)

    async def _get_event(self, event_id: int) -> Event:
        """An event that is not in the trash; trashed events behave as if they do not exist."""
        event = await self._repository.get(event_id)
        if event is None or event.deleted_at is not None:
            raise EventNotFoundError(event_id)
        return event

    async def _get_trashed_event(self, event_id: int) -> Event:
        event = await self._repository.get(event_id)
        if event is None or event.deleted_at is None:
            raise EventNotFoundError(event_id)
        return event
