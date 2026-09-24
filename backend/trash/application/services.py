from collections.abc import Sequence
from datetime import datetime, timedelta

from preferences.application.services import PreferencesService
from trash.application.dtos import TrashItemRead, TrashPurgeResult
from trash.domain.exceptions import TrashModuleNotFoundError
from trash.domain.sources import TrashSource


class TrashService:
    def __init__(self, sources: Sequence[TrashSource], preferences: PreferencesService) -> None:
        self._sources = {source.module: source for source in sources}
        self._preferences = preferences

    async def list_items(self) -> list[TrashItemRead]:
        retention = await self._retention()
        items = [item for source in self._sources.values() for item in await source.list_items()]
        items.sort(key=lambda item: item.deleted_at, reverse=True)
        return [
            TrashItemRead(
                module=item.module,
                id=item.item_id,
                title=item.title,
                deleted_at=item.deleted_at,
                purge_at=item.deleted_at + retention,
            )
            for item in items
        ]

    async def restore(self, module: str, item_id: int) -> None:
        await self._source(module).restore(item_id)

    async def purge(self, module: str, item_id: int) -> None:
        await self._source(module).purge(item_id)

    async def empty(self) -> TrashPurgeResult:
        """Permanently delete everything in the trash, regardless of age."""
        purged = 0
        for source in self._sources.values():
            for item in await source.list_items():
                await source.purge(item.item_id)
                purged += 1
        return TrashPurgeResult(purged=purged)

    async def purge_expired(self, now: datetime) -> TrashPurgeResult:
        cutoff = now - await self._retention()
        purged = 0
        for source in self._sources.values():
            purged += await source.purge_deleted_before(cutoff)
        return TrashPurgeResult(purged=purged)

    async def _retention(self) -> timedelta:
        preferences = await self._preferences.get_preferences()
        return timedelta(days=preferences.trash_retention_days)

    def _source(self, module: str) -> TrashSource:
        source = self._sources.get(module)
        if source is None:
            raise TrashModuleNotFoundError(module)
        return source
