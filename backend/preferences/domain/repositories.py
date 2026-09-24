from typing import Protocol

from preferences.domain.entities import Preferences


class PreferencesRepository(Protocol):
    async def get(self) -> Preferences:
        """Stored preferences, or the defaults when none were saved yet."""
        ...

    async def save(self, preferences: Preferences) -> Preferences: ...
