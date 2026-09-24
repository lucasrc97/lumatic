from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import app
from preferences.api.routes import get_preferences_service
from preferences.application.services import PreferencesService
from preferences.domain.entities import Preferences


class InMemoryPreferencesRepository:
    """Test double implementing the PreferencesRepository contract."""

    def __init__(self) -> None:
        self.stored: Preferences | None = None

    async def get(self) -> Preferences:
        return self.stored or Preferences()

    async def save(self, preferences: Preferences) -> Preferences:
        self.stored = preferences
        return preferences


@pytest.fixture
def service() -> PreferencesService:
    return PreferencesService(InMemoryPreferencesRepository())


@pytest.fixture
def client(service: PreferencesService) -> Iterator[TestClient]:
    app.dependency_overrides[get_preferences_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
