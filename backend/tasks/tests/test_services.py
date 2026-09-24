from datetime import UTC, date, datetime, timedelta

import pytest

from tasks.application.dtos import (
    ColumnCreate,
    ColumnUpdate,
    TaskCreate,
    TaskUpdate,
)
from tasks.application.services import TaskService
from tasks.domain.entities import TaskPriority
from tasks.domain.exceptions import (
    DoneColumnRequiredError,
    InvalidDateRangeError,
    InvalidOrderError,
    TaskColumnNotEmptyError,
    TaskColumnNotFoundError,
    TaskNotFoundError,
)
from tasks.tests.conftest import DOING, DONE, TODO

NOW = datetime(2026, 9, 24, 12, tzinfo=UTC)
LATER = NOW + timedelta(hours=1)


# Tasks


async def test_new_task_goes_to_the_first_column(service: TaskService) -> None:
    created = await service.create_task(TaskCreate(title="  Pay rent  ", description=" "), NOW)

    [listed] = await service.list_tasks()
    assert listed == created
    assert (created.title, created.description, created.column_id) == ("Pay rent", None, TODO)
    assert created.completed_at is None


async def test_task_created_in_the_done_column_is_completed(service: TaskService) -> None:
    created = await service.create_task(TaskCreate(title="Done already", column_id=DONE), NOW)

    assert created.completed_at == NOW


async def test_tasks_are_listed_by_due_date_with_undated_last(service: TaskService) -> None:
    undated = await service.create_task(TaskCreate(title="Someday"), NOW)
    later = await service.create_task(TaskCreate(title="B", due_date=date(2026, 10, 1)), NOW)
    sooner = await service.create_task(TaskCreate(title="A", due_date=date(2026, 9, 25)), NOW)

    assert [t.id for t in await service.list_tasks()] == [sooner.id, later.id, undated.id]


async def test_moving_a_task_through_the_done_column_sets_and_clears_completion(
    service: TaskService,
) -> None:
    task = await service.create_task(TaskCreate(title="Write report"), NOW)

    done = await service.update_task(task.id, TaskUpdate(column_id=DONE), NOW)
    still_done = await service.update_task(task.id, TaskUpdate(title="Final report"), LATER)
    reopened = await service.update_task(task.id, TaskUpdate(column_id=DOING), LATER)

    assert done.completed_at == NOW
    assert still_done.completed_at == NOW
    assert reopened.completed_at is None


async def test_null_clears_optional_fields_but_omitted_fields_are_kept(
    service: TaskService,
) -> None:
    task = await service.create_task(
        TaskCreate(title="Call", description="Mom", due_date=date(2026, 9, 25)), NOW
    )

    kept = await service.update_task(task.id, TaskUpdate(title="Call mom"), NOW)
    cleared = await service.update_task(
        task.id, TaskUpdate.model_validate({"due_date": None, "description": None}), NOW
    )

    assert (kept.description, kept.due_date) == ("Mom", date(2026, 9, 25))
    assert (cleared.title, cleared.description, cleared.due_date) == ("Call mom", None, None)


async def test_unknown_column_is_rejected(service: TaskService) -> None:
    with pytest.raises(TaskColumnNotFoundError):
        await service.create_task(TaskCreate(title="x", column_id=999), NOW)


async def test_priority_defaults_to_none_and_can_be_changed(service: TaskService) -> None:
    task = await service.create_task(TaskCreate(title="Plan"), NOW)

    urgent = await service.update_task(task.id, TaskUpdate(priority=TaskPriority.HIGH), NOW)
    renamed = await service.update_task(task.id, TaskUpdate(title="Plan trip"), NOW)

    assert task.priority is TaskPriority.NONE
    assert urgent.priority is TaskPriority.HIGH
    assert renamed.priority is TaskPriority.HIGH


async def test_list_due_between_returns_active_tasks_in_range(service: TaskService) -> None:
    inside = await service.create_task(TaskCreate(title="A", due_date=date(2026, 9, 25)), NOW)
    await service.create_task(TaskCreate(title="Undated"), NOW)
    await service.create_task(TaskCreate(title="Later", due_date=date(2026, 11, 1)), NOW)
    trashed = await service.create_task(TaskCreate(title="T", due_date=date(2026, 9, 26)), NOW)
    await service.delete_task(trashed.id, NOW)

    due = await service.list_due_between(date(2026, 9, 1), date(2026, 9, 30))

    assert [t.id for t in due] == [inside.id]
    with pytest.raises(InvalidDateRangeError):
        await service.list_due_between(date(2026, 9, 30), date(2026, 9, 1))


async def test_deleted_task_goes_to_trash_and_can_be_restored(service: TaskService) -> None:
    task = await service.create_task(TaskCreate(title="Pay rent"), NOW)

    await service.delete_task(task.id, NOW)

    assert await service.list_tasks() == []
    [trashed] = await service.list_trashed()
    assert (trashed.id, trashed.title, trashed.deleted_at) == (task.id, "Pay rent", NOW)
    with pytest.raises(TaskNotFoundError):
        await service.update_task(task.id, TaskUpdate(title="x"), NOW)

    await service.restore_task(task.id)

    assert [t.id for t in await service.list_tasks()] == [task.id]
    assert await service.list_trashed() == []


async def test_purge_permanently_removes_only_trashed_tasks(service: TaskService) -> None:
    task = await service.create_task(TaskCreate(title="Pay rent"), NOW)

    with pytest.raises(TaskNotFoundError):
        await service.purge_task(task.id)  # not in the trash
    await service.delete_task(task.id, NOW)
    await service.purge_task(task.id)

    assert await service.list_trashed() == []
    with pytest.raises(TaskNotFoundError):
        await service.restore_task(task.id)


async def test_purge_trashed_before_keeps_recent_items(service: TaskService) -> None:
    old = await service.create_task(TaskCreate(title="Old"), NOW)
    recent = await service.create_task(TaskCreate(title="Recent"), NOW)
    await service.delete_task(old.id, NOW - timedelta(days=40))
    await service.delete_task(recent.id, NOW - timedelta(days=5))

    purged = await service.purge_trashed_before(NOW - timedelta(days=30))

    assert purged == 1
    assert [t.id for t in await service.list_trashed()] == [recent.id]


# Columns


async def test_new_column_is_added_at_the_end(service: TaskService) -> None:
    column = await service.create_column(ColumnCreate(name="Waiting"))

    columns = await service.list_columns()

    assert [c.id for c in columns] == [TODO, DOING, DONE, column.id]
    assert (column.color, column.is_done) == ("#94a3b8", False)


async def test_marking_another_column_done_moves_completion(service: TaskService) -> None:
    finished = await service.create_task(TaskCreate(title="A", column_id=DONE), NOW)
    in_progress = await service.create_task(TaskCreate(title="B", column_id=DOING), NOW)

    updated = await service.update_column(DOING, ColumnUpdate(is_done=True), LATER)

    assert updated.is_done
    assert [c.id for c in await service.list_columns() if c.is_done] == [DOING]
    tasks = {t.id: t for t in await service.list_tasks()}
    assert tasks[finished.id].completed_at is None
    assert tasks[in_progress.id].completed_at == LATER


async def test_the_done_column_cannot_stop_being_done(service: TaskService) -> None:
    with pytest.raises(DoneColumnRequiredError):
        await service.update_column(DONE, ColumnUpdate(is_done=False), NOW)

    renamed = await service.update_column(TODO, ColumnUpdate(name="Backlog", is_done=False), NOW)
    assert (renamed.name, renamed.is_done) == ("Backlog", False)


async def test_reorder_requires_every_column_exactly_once(service: TaskService) -> None:
    reordered = await service.reorder_columns([DONE, TODO, DOING])

    assert [c.id for c in reordered] == [DONE, TODO, DOING]
    assert [c.position for c in reordered] == [0, 1, 2]
    for invalid in ([DONE, TODO], [DONE, TODO, TODO], [DONE, TODO, 999]):
        with pytest.raises(InvalidOrderError):
            await service.reorder_columns(invalid)


async def test_column_with_active_tasks_cannot_be_deleted(service: TaskService) -> None:
    await service.create_task(TaskCreate(title="A", column_id=DOING), NOW)

    with pytest.raises(TaskColumnNotEmptyError):
        await service.delete_column(DOING, NOW)


async def test_done_column_cannot_be_deleted(service: TaskService) -> None:
    with pytest.raises(DoneColumnRequiredError):
        await service.delete_column(DONE, NOW)


async def test_deleting_a_column_keeps_its_trashed_tasks_restorable(
    service: TaskService,
) -> None:
    task = await service.create_task(TaskCreate(title="A", column_id=DOING), NOW)
    await service.delete_task(task.id, NOW)

    await service.delete_column(DOING, NOW)
    await service.restore_task(task.id)

    assert [c.id for c in await service.list_columns()] == [TODO, DONE]
    [restored] = await service.list_tasks()
    assert restored.column_id == TODO
