import os
from collections.abc import AsyncIterator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from core.config import settings
from preferences.domain.entities import Preferences
from preferences.infrastructure.repositories import SqlAlchemyPreferencesRepository

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


async def test_save_creates_then_updates_the_single_row(session: AsyncSession) -> None:
    repository = SqlAlchemyPreferencesRepository(session)

    await repository.save(Preferences(trash_retention_days=10))
    assert await repository.get() == Preferences(trash_retention_days=10)
    await repository.save(Preferences(trash_retention_days=20))

    assert await repository.get() == Preferences(trash_retention_days=20)
