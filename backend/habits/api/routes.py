from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from habits.application.dtos import HabitCreate, HabitProgress, HabitRead, HabitUpdate
from habits.application.services import HabitService
from habits.infrastructure.repositories import SqlAlchemyHabitRepository

router = APIRouter(prefix="/api/v1/habits/habits", tags=["habits"])


def get_habit_service(session: Annotated[AsyncSession, Depends(get_session)]) -> HabitService:
    return HabitService(SqlAlchemyHabitRepository(session))


ServiceDep = Annotated[HabitService, Depends(get_habit_service)]


@router.get("", response_model=list[HabitProgress])
async def list_habits(
    service: ServiceDep,
    start: Annotated[date, Query(alias="from")],
    end: Annotated[date, Query(alias="to")],
    today: Annotated[
        date | None, Query(description="Client's local date; defaults to the server date.")
    ] = None,
    include_archived: bool = False,
) -> list[HabitProgress]:
    return await service.list_progress(start, end, today or date.today(), include_archived)


@router.post("", response_model=HabitRead, status_code=status.HTTP_201_CREATED)
async def create_habit(service: ServiceDep, data: HabitCreate) -> HabitRead:
    return await service.create_habit(data)


@router.patch("/{habit_id}", response_model=HabitRead)
async def update_habit(service: ServiceDep, habit_id: int, data: HabitUpdate) -> HabitRead:
    return await service.update_habit(habit_id, data)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(service: ServiceDep, habit_id: int) -> None:
    """Moves the habit to the trash."""
    await service.delete_habit(habit_id, datetime.now(UTC))


@router.put("/{habit_id}/entries/{day}", status_code=status.HTTP_204_NO_CONTENT)
async def complete_day(service: ServiceDep, habit_id: int, day: date) -> None:
    await service.complete_day(habit_id, day)


@router.delete("/{habit_id}/entries/{day}", status_code=status.HTTP_204_NO_CONTENT)
async def uncomplete_day(service: ServiceDep, habit_id: int, day: date) -> None:
    await service.uncomplete_day(habit_id, day)
