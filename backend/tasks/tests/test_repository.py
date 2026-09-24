import os
from collections.abc import AsyncIterator
from dataclasses import replace
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from core.config import settings
from tasks.domain.entities import FieldType, Task
from tasks.infrastructure.repositories import SqlAlchemyTaskRepository

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("RUN_INTEGRATION_TESTS") != "1",
        reason="set RUN_INTEGRATION_TESTS=1 with a migrated database to run",
    ),
]

NOW = datetime(2026, 9, 24, 12, tzinfo=UTC)


async def stored(repository: SqlAlchemyTaskRepository, task_id: int) -> Task:
    task = await repository.get(task_id)
    assert task is not None
    return task


@pytest.fixture
async def session() -> AsyncIterator[AsyncSession]:
    """Session inside an outer transaction that is always rolled back."""
    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    async with engine.connect() as connection:
        transaction = await connection.begin()
        test_session = AsyncSession(
            bind=connection,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        )
        try:
            yield test_session
        finally:
            await test_session.close()
            await transaction.rollback()
    await engine.dispose()


async def test_migration_seeds_three_columns_with_one_done(session: AsyncSession) -> None:
    repository = SqlAlchemyTaskRepository(session)

    columns = await repository.list_columns()

    assert len(columns) >= 3
    assert len([c for c in columns if c.is_done]) == 1


async def test_add_save_and_list_tasks_with_custom_values(session: AsyncSession) -> None:
    repository = SqlAlchemyTaskRepository(session)
    [first, *_] = await repository.list_columns()
    field = await repository.add_field("Hours", FieldType.NUMBER, [], position=99)

    undated = await repository.add("Undated", None, None, first.id, {field.id: 2.5}, None)
    dated = await repository.add("Dated", "desc", date(2026, 9, 25), first.id, {}, None)
    saved = await repository.save(replace(dated, title="Dated!", custom_values={field.id: 3}))

    assert await repository.get(undated.id) == undated
    assert undated.custom_values == {field.id: 2.5}
    assert saved.custom_values == {field.id: 3}
    ids = [t.id for t in await repository.list_tasks()]
    assert ids.index(dated.id) < ids.index(undated.id)  # undated last


async def test_set_done_column_moves_flag_and_completion(session: AsyncSession) -> None:
    repository = SqlAlchemyTaskRepository(session)
    columns = await repository.list_columns()
    old_done = next(c for c in columns if c.is_done)
    new_done = next(c for c in columns if not c.is_done)
    finished = await repository.add("Finished", None, None, old_done.id, {}, NOW)
    open_task = await repository.add("Open", None, None, new_done.id, {}, None)
    later = NOW + timedelta(hours=1)

    await repository.set_done_column(new_done.id, later)

    assert [c.id for c in await repository.list_columns() if c.is_done] == [new_done.id]
    assert (await stored(repository, finished.id)).completed_at is None
    assert (await stored(repository, open_task.id)).completed_at == later


async def test_positions_and_column_deletion(session: AsyncSession) -> None:
    repository = SqlAlchemyTaskRepository(session)
    target = next(c for c in await repository.list_columns() if not c.is_done)
    extra = await repository.add_column("Extra", "#000000", position=99)
    trashed = await repository.add("Trashed", None, None, extra.id, {}, None)
    await repository.save(replace(trashed, deleted_at=NOW))

    ids = [c.id for c in await repository.list_columns()]
    await repository.set_column_positions([extra.id, *[i for i in ids if i != extra.id]])
    assert (await repository.list_columns())[0].id == extra.id

    await repository.delete_column(extra.id, move_tasks_to=target.id, completed_at=None)

    assert await repository.get_column(extra.id) is None
    assert (await stored(repository, trashed.id)).column_id == target.id


async def test_field_changes_clean_task_values(session: AsyncSession) -> None:
    repository = SqlAlchemyTaskRepository(session)
    [column, *_] = await repository.list_columns()
    select = await repository.add_field("Priority", FieldType.SELECT, ["Low", "High"], 98)
    notes = await repository.add_field("Notes", FieldType.TEXT, [], 99)
    values = {select.id: "Low", notes.id: "a"}
    low = await repository.add("Low", None, None, column.id, values, None)
    high = await repository.add("High", None, None, column.id, {select.id: "High"}, None)

    await repository.save_field(replace(select, options=("High",)))
    await repository.delete_field(notes.id)

    assert (await stored(repository, low.id)).custom_values == {}
    assert (await stored(repository, high.id)).custom_values == {
        select.id: "High"
    }
    assert await repository.get_field(notes.id) is None


async def test_trashed_tasks_are_listed_apart_and_purged(session: AsyncSession) -> None:
    repository = SqlAlchemyTaskRepository(session)
    [column, *_] = await repository.list_columns()
    old = await repository.add("Old", None, None, column.id, {}, None)
    recent = await repository.add("Recent", None, None, column.id, {}, None)
    await repository.save(replace(old, deleted_at=NOW - timedelta(days=40)))
    await repository.save(replace(recent, deleted_at=NOW - timedelta(days=5)))

    active_ids = [t.id for t in await repository.list_tasks()]
    deleted_ids = [t.id for t in await repository.list_deleted()]
    purged = await repository.purge_deleted_before(NOW - timedelta(days=30))

    assert old.id not in active_ids and recent.id not in active_ids
    assert deleted_ids.index(recent.id) < deleted_ids.index(old.id)  # newest first
    assert purged >= 1
    assert await repository.get(old.id) is None

    await repository.purge(recent.id)
    assert await repository.get(recent.id) is None
