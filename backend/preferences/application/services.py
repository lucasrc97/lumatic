from dataclasses import replace

from preferences.application.dtos import PreferencesRead, PreferencesUpdate
from preferences.domain.repositories import PreferencesRepository


class PreferencesService:
    def __init__(self, repository: PreferencesRepository) -> None:
        self._repository = repository

    async def get_preferences(self) -> PreferencesRead:
        return PreferencesRead.from_entity(await self._repository.get())

    async def update_preferences(self, data: PreferencesUpdate) -> PreferencesRead:
        current = await self._repository.get()
        changes = {
            field: value
            for field, value in data.model_dump(exclude_unset=True).items()
            if value is not None
        }
        if not changes:
            return PreferencesRead.from_entity(current)
        saved = await self._repository.save(replace(current, **changes))
        return PreferencesRead.from_entity(saved)
