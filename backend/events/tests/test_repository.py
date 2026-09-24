import os
from collections.abc import AsyncIterator
from dataclasses import replace
from datetime import UTC, date, datetime, time, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from core.config import settings
from events.infrastructure.repositories import SqlAlchemyEventRepository

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("RUN_INTEGRATION_TESTS") != "1",
        reason="set RUN_INTEGRATION_TESTS=1 with a migrated database to run",
    ),
]

NOW = datetime(2026, 9, 24, 12, tzinfo=UTC)
# Far-future dates keep these tests clear of real data in the development database.
DAY = date(2031, 5, 10)


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


async def test_add_save_and_list_between(session: AsyncSession) -> None:
    repository = SqlAlchemyEventRepository(session)
    timed = await repository.add("Timed", "desc", DAY, time(9), time(10))
    all_day = await repository.add("All day", None, DAY, None, None)
    await repository.add("Outside", None, DAY + timedelta(days=40), None, None)

    saved = await repository.save(replace(timed, title="Timed!", end_time=None))
    listed = await repository.list_between(DAY, DAY + timedelta(days=1))

    assert saved.title == "Timed!" and saved.end_time is None
    assert [e.id for e in listed] == [all_day.id, timed.id]  # all-day first
    assert await repository.get(timed.id) == saved


async def test_trashed_events_are_listed_apart_and_purged(session: AsyncSession) -> None:
    repository = SqlAlchemyEventRepository(session)
    old = await repository.add("Old", None, DAY, None, None)
    recent = await repository.add("Recent", None, DAY, None, None)
    await repository.save(replace(old, deleted_at=NOW - timedelta(days=40)))
    await repository.save(replace(recent, deleted_at=NOW - timedelta(days=5)))

    listed = await repository.list_between(DAY, DAY)
    deleted_ids = [e.id for e in await repository.list_deleted()]
    purged = await repository.purge_deleted_before(NOW - timedelta(days=30))

    assert listed == []
    assert deleted_ids.index(recent.id) < deleted_ids.index(old.id)  # newest first
    assert purged >= 1
    assert await repository.get(old.id) is None

    await repository.purge(recent.id)
    assert await repository.get(recent.id) is None
