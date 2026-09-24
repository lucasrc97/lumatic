from datetime import UTC, date, datetime, timedelta

import pytest

from habits.application.dtos import HabitCreate, HabitUpdate
from habits.application.services import HabitService
from habits.domain.exceptions import (
    HabitArchivedError,
    HabitNotFoundError,
    InvalidDateRangeError,
)
from habits.tests.conftest import InMemoryHabitRepository

TODAY = date(2026, 9, 24)
NOW = datetime(2026, 9, 24, 12, tzinfo=UTC)
WEEK_START = date(2026, 9, 21)
WEEK_END = date(2026, 9, 27)


async def test_created_habit_appears_in_progress_list(service: HabitService) -> None:
    created = await service.create_habit(HabitCreate(name="  Read  ", color="#123abc"))

    [progress] = await service.list_progress(WEEK_START, WEEK_END, TODAY)

    assert created.name == "Read"
    assert progress.id == created.id
    assert progress.current_streak == 0
    assert progress.completed_dates == []


async def test_progress_limits_dates_to_range_but_streak_uses_full_history(
    service: HabitService,
) -> None:
    habit = await service.create_habit(HabitCreate(name="Run"))
    for offset in range(5):  # Sep 20..24
        await service.complete_day(habit.id, TODAY - timedelta(days=offset))

    [progress] = await service.list_progress(WEEK_START, WEEK_END, TODAY)

    assert progress.completed_dates == [date(2026, 9, d) for d in (21, 22, 23, 24)]
    assert progress.current_streak == 5
    assert progress.longest_streak == 5


async def test_completing_a_day_twice_is_idempotent(service: HabitService) -> None:
    habit = await service.create_habit(HabitCreate(name="Run"))

    await service.complete_day(habit.id, TODAY)
    await service.complete_day(habit.id, TODAY)
    await service.uncomplete_day(habit.id, TODAY)

    [progress] = await service.list_progress(WEEK_START, WEEK_END, TODAY)
    assert progress.completed_dates == []


async def test_update_changes_only_provided_fields(service: HabitService) -> None:
    habit = await service.create_habit(HabitCreate(name="Run", color="#000000"))

    updated = await service.update_habit(habit.id, HabitUpdate(name="Walk"))

    assert updated.name == "Walk"
    assert updated.color == "#000000"


async def test_archived_habits_are_hidden_and_locked(service: HabitService) -> None:
    habit = await service.create_habit(HabitCreate(name="Run"))

    await service.update_habit(habit.id, HabitUpdate(archived=True))

    assert await service.list_progress(WEEK_START, WEEK_END, TODAY) == []
    assert len(await service.list_progress(WEEK_START, WEEK_END, TODAY, True)) == 1
    with pytest.raises(HabitArchivedError):
        await service.complete_day(habit.id, TODAY)


async def test_unknown_habit_raises_not_found(service: HabitService) -> None:
    with pytest.raises(HabitNotFoundError):
        await service.update_habit(999, HabitUpdate(name="x"))
    with pytest.raises(HabitNotFoundError):
        await service.complete_day(999, TODAY)


@pytest.mark.parametrize(
    ("start", "end"),
    [(WEEK_END, WEEK_START), (date(2026, 1, 1), date(2027, 1, 2))],  # inverted; 367 days
)
async def test_invalid_date_ranges_are_rejected(
    service: HabitService, start: date, end: date
) -> None:
    with pytest.raises(InvalidDateRangeError):
        await service.list_progress(start, end, TODAY)


async def test_deleted_habit_goes_to_trash_and_can_be_restored(service: HabitService) -> None:
    habit = await service.create_habit(HabitCreate(name="Run"))
    await service.complete_day(habit.id, TODAY)

    await service.delete_habit(habit.id, NOW)

    assert await service.list_progress(WEEK_START, WEEK_END, TODAY, True) == []
    [trashed] = await service.list_trashed()
    assert (trashed.id, trashed.name, trashed.deleted_at) == (habit.id, "Run", NOW)
    with pytest.raises(HabitNotFoundError):
        await service.update_habit(habit.id, HabitUpdate(name="x"))
    with pytest.raises(HabitNotFoundError):
        await service.complete_day(habit.id, TODAY)

    await service.restore_habit(habit.id)

    [progress] = await service.list_progress(WEEK_START, WEEK_END, TODAY)
    assert progress.completed_dates == [TODAY]
    assert await service.list_trashed() == []


async def test_purge_permanently_removes_only_trashed_habits(
    service: HabitService, repository: InMemoryHabitRepository
) -> None:
    habit = await service.create_habit(HabitCreate(name="Run"))
    await service.complete_day(habit.id, TODAY)

    with pytest.raises(HabitNotFoundError):
        await service.purge_habit(habit.id)  # not in the trash
    await service.delete_habit(habit.id, NOW)
    await service.purge_habit(habit.id)

    assert await service.list_trashed() == []
    assert repository.entries == set()
    with pytest.raises(HabitNotFoundError):
        await service.restore_habit(habit.id)


async def test_purge_trashed_before_keeps_recent_items(service: HabitService) -> None:
    old = await service.create_habit(HabitCreate(name="Old"))
    recent = await service.create_habit(HabitCreate(name="Recent"))
    await service.delete_habit(old.id, NOW - timedelta(days=40))
    await service.delete_habit(recent.id, NOW - timedelta(days=5))

    purged = await service.purge_trashed_before(NOW - timedelta(days=30))

    assert purged == 1
    assert [h.id for h in await service.list_trashed()] == [recent.id]
