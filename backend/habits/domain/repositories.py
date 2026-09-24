from collections.abc import Sequence
from datetime import date, datetime
from typing import Protocol

from habits.domain.entities import Habit


class HabitRepository(Protocol):
    async def list_habits(self, include_archived: bool) -> list[Habit]:
        """Habits that are not in the trash."""
        ...

    async def get(self, habit_id: int) -> Habit | None:
        """Any habit by id, including one in the trash."""
        ...

    async def add(self, name: str, color: str) -> Habit: ...

    async def save(self, habit: Habit) -> Habit: ...

    async def list_entry_dates(
        self, habit_ids: Sequence[int], until: date
    ) -> dict[int, list[date]]:
        """Completed dates up to and including `until`, keyed by habit id."""
        ...

    async def add_entry(self, habit_id: int, entry_date: date) -> None:
        """Idempotent: adding an existing entry is a no-op."""
        ...

    async def remove_entry(self, habit_id: int, entry_date: date) -> None:
        """Idempotent: removing a missing entry is a no-op."""
        ...

    async def list_deleted(self) -> list[Habit]:
        """Habits in the trash, most recently deleted first."""
        ...

    async def purge(self, habit_id: int) -> None:
        """Permanently delete a habit and its entries."""
        ...

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        """Permanently delete habits trashed before `cutoff`; returns how many were deleted."""
        ...
