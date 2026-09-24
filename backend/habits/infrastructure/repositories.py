from collections.abc import Sequence
from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from habits.domain.entities import Habit
from habits.infrastructure.persistence import HabitEntryModel, HabitModel


def _to_entity(model: HabitModel) -> Habit:
    return Habit(
        id=model.id,
        name=model.name,
        color=model.color,
        archived=model.archived,
        created_at=model.created_at,
    )


class SqlAlchemyHabitRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_habits(self, include_archived: bool) -> list[Habit]:
        query = select(HabitModel).order_by(HabitModel.created_at, HabitModel.id)
        if not include_archived:
            query = query.where(HabitModel.archived.is_(False))
        result = await self._session.scalars(query)
        return [_to_entity(model) for model in result]

    async def get(self, habit_id: int) -> Habit | None:
        model = await self._session.get(HabitModel, habit_id)
        return _to_entity(model) if model is not None else None

    async def add(self, name: str, color: str) -> Habit:
        model = HabitModel(name=name, color=color)
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return _to_entity(model)

    async def save(self, habit: Habit) -> Habit:
        model = await self._session.get_one(HabitModel, habit.id)
        model.name = habit.name
        model.color = habit.color
        model.archived = habit.archived
        await self._session.commit()
        return _to_entity(model)

    async def list_entry_dates(
        self, habit_ids: Sequence[int], until: date
    ) -> dict[int, list[date]]:
        if not habit_ids:
            return {}
        rows = await self._session.execute(
            select(HabitEntryModel.habit_id, HabitEntryModel.entry_date)
            .where(HabitEntryModel.habit_id.in_(habit_ids))
            .where(HabitEntryModel.entry_date <= until)
            .order_by(HabitEntryModel.entry_date)
        )
        entries: dict[int, list[date]] = {}
        for habit_id, entry_date in rows:
            entries.setdefault(habit_id, []).append(entry_date)
        return entries

    async def add_entry(self, habit_id: int, entry_date: date) -> None:
        await self._session.execute(
            insert(HabitEntryModel)
            .values(habit_id=habit_id, entry_date=entry_date)
            .on_conflict_do_nothing()
        )
        await self._session.commit()

    async def remove_entry(self, habit_id: int, entry_date: date) -> None:
        await self._session.execute(
            delete(HabitEntryModel).where(
                HabitEntryModel.habit_id == habit_id,
                HabitEntryModel.entry_date == entry_date,
            )
        )
        await self._session.commit()
