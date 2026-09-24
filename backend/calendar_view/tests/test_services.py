from datetime import UTC, date, datetime, time

import pytest

from calendar_view.application.services import CalendarService
from calendar_view.domain.entities import CalendarItem
from calendar_view.domain.exceptions import InvalidDateRangeError
from calendar_view.infrastructure.sources import EventCalendarSource, TaskCalendarSource
from events.application.dtos import EventCreate
from events.application.services import EventService
from events.tests.conftest import InMemoryEventRepository
from tasks.application.dtos import TaskCreate
from tasks.application.services import TaskService
from tasks.tests.conftest import DONE, InMemoryTaskRepository

NOW = datetime(2026, 9, 24, 12, tzinfo=UTC)
SEPT = (date(2026, 9, 1), date(2026, 9, 30))


class FakeCalendarSource:
    def __init__(self, module: str, items: list[CalendarItem]) -> None:
        self.module = module
        self.items = items

    async def items_between(self, start: date, end: date) -> list[CalendarItem]:
        return [i for i in self.items if start <= i.day <= end]


async def test_items_from_every_module_are_merged_by_day_all_day_first_then_time() -> None:
    day = date(2026, 9, 25)
    events = FakeCalendarSource(
        "events",
        [
            CalendarItem("events", 1, "Dentist", day, time(15)),
            CalendarItem("events", 2, "Standup", day, time(9)),
            CalendarItem("events", 3, "Next day", date(2026, 9, 26)),
        ],
    )
    tasks = FakeCalendarSource("tasks", [CalendarItem("tasks", 7, "Pay rent", day)])
    service = CalendarService([events, tasks])

    items = await service.list_items(*SEPT)

    assert [(i.module, i.id) for i in items] == [
        ("tasks", 7),
        ("events", 2),
        ("events", 1),
        ("events", 3),
    ]


@pytest.mark.parametrize(
    ("start", "end"),
    [(date(2026, 9, 30), date(2026, 9, 1)), (date(2026, 9, 1), date(2026, 11, 2))],
)
async def test_invalid_ranges_are_rejected(start: date, end: date) -> None:
    with pytest.raises(InvalidDateRangeError):
        await CalendarService([]).list_items(start, end)


async def test_adapters_expose_events_and_task_due_dates() -> None:
    events = EventService(InMemoryEventRepository())
    tasks = TaskService(InMemoryTaskRepository())
    event = await events.create_event(
        EventCreate(
            title="Dentist",
            event_date=date(2026, 9, 25),
            start_time=time(15),
            end_time=time(16),
        )
    )
    open_task = await tasks.create_task(TaskCreate(title="Pay", due_date=date(2026, 9, 25)), NOW)
    done_task = await tasks.create_task(
        TaskCreate(title="Done", due_date=date(2026, 9, 26), column_id=DONE), NOW
    )
    await tasks.create_task(TaskCreate(title="Undated"), NOW)
    service = CalendarService([EventCalendarSource(events), TaskCalendarSource(tasks)])

    items = await service.list_items(*SEPT)

    assert [(i.module, i.id, i.completed) for i in items] == [
        ("tasks", open_task.id, False),
        ("events", event.id, False),
        ("tasks", done_task.id, True),
    ]
    assert (items[1].start_time, items[1].end_time) == (time(15), time(16))
