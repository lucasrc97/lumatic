from datetime import UTC, date, datetime, timedelta

import pytest

from habits.application.dtos import HabitCreate
from habits.application.services import HabitService
from habits.tests.conftest import InMemoryHabitRepository
from preferences.application.dtos import PreferencesUpdate
from preferences.application.services import PreferencesService
from tasks.application.dtos import TaskCreate
from tasks.application.services import TaskService
from tasks.tests.conftest import InMemoryTaskRepository
from trash.application.services import TrashService
from trash.domain.exceptions import TrashModuleNotFoundError
from trash.infrastructure.sources import HabitTrashSource, TaskTrashSource
from trash.tests.conftest import FakeTrashSource

NOW = datetime(2026, 9, 24, 12, tzinfo=UTC)


def days_ago(days: int) -> datetime:
    return NOW - timedelta(days=days)


@pytest.fixture
def habits_source() -> FakeTrashSource:
    return FakeTrashSource("habits", [(1, "Run", days_ago(40)), (2, "Read", days_ago(1))])


@pytest.fixture
def tasks_source() -> FakeTrashSource:
    return FakeTrashSource("tasks", [(1, "Pay rent", days_ago(10))])


@pytest.fixture
def service(
    habits_source: FakeTrashSource,
    tasks_source: FakeTrashSource,
    preferences: PreferencesService,
) -> TrashService:
    return TrashService([habits_source, tasks_source], preferences)


async def test_lists_items_from_every_module_newest_first_with_purge_date(
    service: TrashService,
) -> None:
    items = await service.list_items()

    assert [(i.module, i.id) for i in items] == [("habits", 2), ("tasks", 1), ("habits", 1)]
    assert items[0].purge_at == days_ago(1) + timedelta(days=30)


async def test_purge_date_follows_the_retention_preference(
    service: TrashService, preferences: PreferencesService
) -> None:
    await preferences.update_preferences(PreferencesUpdate(trash_retention_days=7))

    [newest, *_] = await service.list_items()

    assert newest.purge_at == days_ago(1) + timedelta(days=7)


async def test_restore_and_purge_are_routed_to_the_owning_module(
    service: TrashService, habits_source: FakeTrashSource, tasks_source: FakeTrashSource
) -> None:
    await service.restore("habits", 2)
    await service.purge("tasks", 1)

    assert habits_source.restored == [2]
    assert tasks_source.items == {}


async def test_unknown_module_is_rejected(service: TrashService) -> None:
    with pytest.raises(TrashModuleNotFoundError):
        await service.restore("nope", 1)


async def test_empty_purges_everything(service: TrashService) -> None:
    result = await service.empty()

    assert result.purged == 3
    assert await service.list_items() == []


async def test_purge_expired_uses_the_retention_preference(
    service: TrashService, preferences: PreferencesService
) -> None:
    assert (await service.purge_expired(NOW)).purged == 1  # only the 40-day-old item

    await preferences.update_preferences(PreferencesUpdate(trash_retention_days=5))

    assert (await service.purge_expired(NOW)).purged == 1  # the 10-day-old task
    assert [(i.module, i.id) for i in await service.list_items()] == [("habits", 2)]


async def test_habit_source_exposes_trashed_habits(preferences: PreferencesService) -> None:
    habits = HabitService(InMemoryHabitRepository())
    habit = await habits.create_habit(HabitCreate(name="Run"))
    await habits.complete_day(habit.id, date(2026, 9, 20))
    await habits.delete_habit(habit.id, days_ago(2))
    service = TrashService([HabitTrashSource(habits)], preferences)

    [item] = await service.list_items()
    assert (item.module, item.id, item.title) == ("habits", habit.id, "Run")

    await service.restore("habits", habit.id)
    assert await service.list_items() == []
    assert await habits.list_trashed() == []


async def test_task_source_exposes_trashed_tasks(preferences: PreferencesService) -> None:
    tasks = TaskService(InMemoryTaskRepository())
    task = await tasks.create_task(TaskCreate(title="Pay rent"), NOW)
    await tasks.delete_task(task.id, days_ago(2))
    service = TrashService([TaskTrashSource(tasks)], preferences)

    [item] = await service.list_items()
    assert (item.module, item.id, item.title) == ("tasks", task.id, "Pay rent")

    await service.restore("tasks", task.id)
    assert await service.list_items() == []
    assert [t.id for t in await tasks.list_tasks()] == [task.id]
