from datetime import UTC, date, datetime, time, timedelta

import pytest

from events.application.dtos import EventCreate, EventUpdate
from events.application.services import EventService
from events.domain.exceptions import (
    EventNotFoundError,
    InvalidDateRangeError,
    InvalidEventTimeError,
)

NOW = datetime(2026, 9, 24, 12, tzinfo=UTC)
SEPT = (date(2026, 9, 1), date(2026, 9, 30))


def event(title: str, day: int, start: time | None = None, end: time | None = None) -> EventCreate:
    return EventCreate(
        title=title, event_date=date(2026, 9, day), start_time=start, end_time=end
    )


async def test_events_are_listed_by_day_with_all_day_first(service: EventService) -> None:
    later = await service.create_event(event("Dentist", 25, time(15)))
    earlier = await service.create_event(event("Standup", 25, time(9), time(9, 15)))
    all_day = await service.create_event(event("Holiday", 25))
    previous_day = await service.create_event(event("Gym", 24, time(18)))
    await service.create_event(event("Out of range", 1).model_copy(
        update={"event_date": date(2026, 10, 1)}
    ))

    listed = await service.list_events(*SEPT)

    assert [e.id for e in listed] == [previous_day.id, all_day.id, earlier.id, later.id]


async def test_create_strips_text_and_validates_times(service: EventService) -> None:
    created = await service.create_event(
        EventCreate(title="  Meeting ", description=" ", event_date=date(2026, 9, 25))
    )

    assert (created.title, created.description, created.start_time) == ("Meeting", None, None)
    with pytest.raises(InvalidEventTimeError):
        await service.create_event(event("Bad", 25, time(10), time(9)))
    with pytest.raises(InvalidEventTimeError):
        await service.create_event(event("No start", 25, None, time(9)))


async def test_update_changes_provided_fields_and_null_clears_times(
    service: EventService,
) -> None:
    created = await service.create_event(event("Call", 25, time(9), time(10)))

    moved = await service.update_event(created.id, EventUpdate(event_date=date(2026, 9, 26)))
    all_day = await service.update_event(
        created.id, EventUpdate.model_validate({"start_time": None, "end_time": None})
    )

    assert (moved.event_date, moved.start_time) == (date(2026, 9, 26), time(9))
    assert (all_day.start_time, all_day.end_time, all_day.title) == (None, None, "Call")
    with pytest.raises(InvalidEventTimeError):
        await service.update_event(created.id, EventUpdate(end_time=time(11)))


async def test_invalid_ranges_are_rejected(service: EventService) -> None:
    with pytest.raises(InvalidDateRangeError):
        await service.list_events(date(2026, 9, 30), date(2026, 9, 1))
    with pytest.raises(InvalidDateRangeError):
        await service.list_events(date(2026, 1, 1), date(2027, 1, 2))


async def test_deleted_event_goes_to_trash_and_can_be_restored(service: EventService) -> None:
    created = await service.create_event(event("Party", 26))

    await service.delete_event(created.id, NOW)

    assert await service.list_events(*SEPT) == []
    [trashed] = await service.list_trashed()
    assert (trashed.id, trashed.title, trashed.deleted_at) == (created.id, "Party", NOW)
    with pytest.raises(EventNotFoundError):
        await service.update_event(created.id, EventUpdate(title="x"))

    await service.restore_event(created.id)

    assert [e.id for e in await service.list_events(*SEPT)] == [created.id]


async def test_purge_only_affects_trashed_events(service: EventService) -> None:
    old = await service.create_event(event("Old", 2))
    recent = await service.create_event(event("Recent", 3))

    with pytest.raises(EventNotFoundError):
        await service.purge_event(old.id)  # not in the trash
    await service.delete_event(old.id, NOW - timedelta(days=40))
    await service.delete_event(recent.id, NOW - timedelta(days=5))

    assert await service.purge_trashed_before(NOW - timedelta(days=30)) == 1
    await service.purge_event(recent.id)
    assert await service.list_trashed() == []
