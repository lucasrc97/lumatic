from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from preferences.domain.entities import Preferences
from preferences.infrastructure.persistence import SINGLETON_ID, PreferencesModel


class SqlAlchemyPreferencesRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self) -> Preferences:
        # `save` writes with a Core upsert, so refresh any instance already in the session.
        model = await self._session.get(PreferencesModel, SINGLETON_ID, populate_existing=True)
        if model is None:
            return Preferences()
        return Preferences(trash_retention_days=model.trash_retention_days)

    async def save(self, preferences: Preferences) -> Preferences:
        values = {"trash_retention_days": preferences.trash_retention_days}
        await self._session.execute(
            insert(PreferencesModel)
            .values(id=SINGLETON_ID, **values)
            .on_conflict_do_update(index_elements=[PreferencesModel.id], set_=values)
        )
        await self._session.commit()
        return preferences
