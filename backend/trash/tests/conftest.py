from collections.abc import Iterator
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.main import app
from preferences.application.services import PreferencesService
from preferences.tests.conftest import InMemoryPreferencesRepository
from trash.api.routes import get_trash_service
from trash.application.services import TrashService
from trash.domain.entities import TrashItem


class FakeTrashSource:
    """In-memory TrashSource for one module; items are (id, title, deleted_at)."""

    def __init__(self, module: str, items: list[tuple[int, str, datetime]]) -> None:
        self.module = module
        self.items = {item_id: (title, deleted_at) for item_id, title, deleted_at in items}
        self.restored: list[int] = []

    async def list_items(self) -> list[TrashItem]:
        return [
            TrashItem(module=self.module, item_id=item_id, title=title, deleted_at=deleted_at)
            for item_id, (title, deleted_at) in self.items.items()
        ]

    async def restore(self, item_id: int) -> None:
        del self.items[item_id]
        self.restored.append(item_id)

    async def purge(self, item_id: int) -> None:
        del self.items[item_id]

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        expired = [item_id for item_id, (_, at) in self.items.items() if at < cutoff]
        for item_id in expired:
            del self.items[item_id]
        return len(expired)


@pytest.fixture
def preferences() -> PreferencesService:
    return PreferencesService(InMemoryPreferencesRepository())


@pytest.fixture
def client(preferences: PreferencesService) -> Iterator[TestClient]:
    service = TrashService([], preferences)
    app.dependency_overrides[get_trash_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
