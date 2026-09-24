import os
from collections.abc import AsyncIterator
from dataclasses import replace
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from core.config import settings
from habits.infrastructure.repositories import SqlAlchemyHabitRepository

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("RUN_INTEGRATION_TESTS") != "1",
        reason="set RUN_INTEGRATION_TESTS=1 with a migrated database to run",
    ),
]


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


async def test_add_get_and_save_habit(session: AsyncSession) -> None:
    repository = SqlAlchemyHabitRepository(session)

    created = await repository.add(name="Read", color="#123456")
    saved = await repository.save(replace(created, name="Read more", archived=True))

    assert created.created_at is not None
    assert await repository.get(created.id) == saved
    assert created.id not in [h.id for h in await repository.list_habits(False)]
    assert created.id in [h.id for h in await repository.list_habits(True)]


async def test_entries_are_idempotent_and_filtered_by_date(session: AsyncSession) -> None:
    repository = SqlAlchemyHabitRepository(session)
    habit = await repository.add(name="Run", color="#123456")

    await repository.add_entry(habit.id, date(2026, 9, 23))
    await repository.add_entry(habit.id, date(2026, 9, 23))
    await repository.add_entry(habit.id, date(2026, 9, 25))
    await repository.remove_entry(habit.id, date(2026, 9, 1))

    entries = await repository.list_entry_dates([habit.id], until=date(2026, 9, 24))
    assert entries == {habit.id: [date(2026, 9, 23)]}


async def test_trashed_habits_are_listed_apart_and_purged(session: AsyncSession) -> None:
    repository = SqlAlchemyHabitRepository(session)
    now = datetime(2026, 9, 24, 12, tzinfo=UTC)
    old = await repository.add(name="Old", color="#123456")
    recent = await repository.add(name="Recent", color="#123456")
    await repository.add_entry(old.id, date(2026, 9, 1))
    await repository.save(replace(old, deleted_at=now - timedelta(days=40)))
    await repository.save(replace(recent, deleted_at=now - timedelta(days=5)))

    active_ids = [h.id for h in await repository.list_habits(True)]
    deleted_ids = [h.id for h in await repository.list_deleted()]
    purged = await repository.purge_deleted_before(now - timedelta(days=30))

    assert old.id not in active_ids and recent.id not in active_ids
    assert deleted_ids.index(recent.id) < deleted_ids.index(old.id)  # newest first
    assert purged >= 1
    assert await repository.get(old.id) is None
    assert await repository.list_entry_dates([old.id], until=date(2026, 9, 30)) == {}

    await repository.purge(recent.id)
    assert await repository.get(recent.id) is None
