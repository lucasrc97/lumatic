from collections.abc import Iterator, Sequence
from dataclasses import replace
from datetime import UTC, date, datetime

import pytest
from fastapi.testclient import TestClient

from app.main import app
from habits.api.routes import get_habit_service
from habits.application.services import HabitService
from habits.domain.entities import Habit


class InMemoryHabitRepository:
    """Test double implementing the HabitRepository contract."""

    def __init__(self) -> None:
        self.habits: dict[int, Habit] = {}
        self.entries: set[tuple[int, date]] = set()
        self._next_id = 1

    async def list_habits(self, include_archived: bool) -> list[Habit]:
        return [
            h
            for h in self.habits.values()
            if h.deleted_at is None and (include_archived or not h.archived)
        ]

    async def get(self, habit_id: int) -> Habit | None:
        return self.habits.get(habit_id)

    async def add(self, name: str, color: str) -> Habit:
        habit = Habit(
            id=self._next_id,
            name=name,
            color=color,
            archived=False,
            created_at=datetime(2026, 1, 1, tzinfo=UTC),
        )
        self.habits[habit.id] = habit
        self._next_id += 1
        return habit

    async def save(self, habit: Habit) -> Habit:
        self.habits[habit.id] = replace(habit)
        return habit

    async def list_entry_dates(
        self, habit_ids: Sequence[int], until: date
    ) -> dict[int, list[date]]:
        result: dict[int, list[date]] = {}
        for habit_id, day in sorted(self.entries, key=lambda entry: entry[1]):
            if habit_id in habit_ids and day <= until:
                result.setdefault(habit_id, []).append(day)
        return result

    async def add_entry(self, habit_id: int, entry_date: date) -> None:
        self.entries.add((habit_id, entry_date))

    async def remove_entry(self, habit_id: int, entry_date: date) -> None:
        self.entries.discard((habit_id, entry_date))

    async def list_deleted(self) -> list[Habit]:
        deleted = [h for h in self.habits.values() if h.deleted_at is not None]
        return sorted(deleted, key=lambda h: (h.deleted_at, -h.id), reverse=True)

    async def purge(self, habit_id: int) -> None:
        self.habits.pop(habit_id, None)
        self.entries = {entry for entry in self.entries if entry[0] != habit_id}

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        expired = [
            h.id for h in self.habits.values() if h.deleted_at is not None and h.deleted_at < cutoff
        ]
        for habit_id in expired:
            await self.purge(habit_id)
        return len(expired)


@pytest.fixture
def repository() -> InMemoryHabitRepository:
    return InMemoryHabitRepository()


@pytest.fixture
def service(repository: InMemoryHabitRepository) -> HabitService:
    return HabitService(repository)


@pytest.fixture
def client(service: HabitService) -> Iterator[TestClient]:
    app.dependency_overrides[get_habit_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
