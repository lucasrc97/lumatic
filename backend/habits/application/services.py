from dataclasses import replace
from datetime import date

from habits.application.dtos import HabitCreate, HabitProgress, HabitRead, HabitUpdate
from habits.domain.entities import Habit, current_streak, longest_streak
from habits.domain.exceptions import (
    HabitArchivedError,
    HabitNotFoundError,
    InvalidDateRangeError,
)
from habits.domain.repositories import HabitRepository

MAX_RANGE_DAYS = 366


class HabitService:
    def __init__(self, repository: HabitRepository) -> None:
        self._repository = repository

    async def list_progress(
        self, start: date, end: date, today: date, include_archived: bool = False
    ) -> list[HabitProgress]:
        if start > end:
            raise InvalidDateRangeError("'from' must be on or before 'to'.")
        if (end - start).days >= MAX_RANGE_DAYS:
            raise InvalidDateRangeError(f"Date range cannot exceed {MAX_RANGE_DAYS} days.")

        habits = await self._repository.list_habits(include_archived)
        entries = await self._repository.list_entry_dates(
            [habit.id for habit in habits], until=max(end, today)
        )
        return [
            HabitProgress(
                **HabitRead.from_entity(habit).model_dump(),
                current_streak=current_streak(entries.get(habit.id, []), today),
                longest_streak=longest_streak(entries.get(habit.id, [])),
                completed_dates=sorted(d for d in entries.get(habit.id, []) if start <= d <= end),
            )
            for habit in habits
        ]

    async def create_habit(self, data: HabitCreate) -> HabitRead:
        habit = await self._repository.add(name=data.name, color=data.color)
        return HabitRead.from_entity(habit)

    async def update_habit(self, habit_id: int, data: HabitUpdate) -> HabitRead:
        habit = await self._get_habit(habit_id)
        changes = {
            field: value
            for field, value in data.model_dump(exclude_unset=True).items()
            if value is not None
        }
        if not changes:
            return HabitRead.from_entity(habit)
        saved = await self._repository.save(replace(habit, **changes))
        return HabitRead.from_entity(saved)

    async def complete_day(self, habit_id: int, day: date) -> None:
        await self._get_active_habit(habit_id)
        await self._repository.add_entry(habit_id, day)

    async def uncomplete_day(self, habit_id: int, day: date) -> None:
        await self._get_active_habit(habit_id)
        await self._repository.remove_entry(habit_id, day)

    async def _get_habit(self, habit_id: int) -> Habit:
        habit = await self._repository.get(habit_id)
        if habit is None:
            raise HabitNotFoundError(habit_id)
        return habit

    async def _get_active_habit(self, habit_id: int) -> Habit:
        habit = await self._get_habit(habit_id)
        if habit.archived:
            raise HabitArchivedError(habit_id)
        return habit
