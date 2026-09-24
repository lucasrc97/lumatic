from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from events.application.dtos import EventCreate, EventRead, EventUpdate
from events.application.services import EventService
from events.infrastructure.repositories import SqlAlchemyEventRepository

router = APIRouter(prefix="/api/v1/events/events", tags=["events"])


def get_event_service(session: Annotated[AsyncSession, Depends(get_session)]) -> EventService:
    return EventService(SqlAlchemyEventRepository(session))


ServiceDep = Annotated[EventService, Depends(get_event_service)]


@router.get("", response_model=list[EventRead])
async def list_events(
    service: ServiceDep,
    start: Annotated[date, Query(alias="from")],
    end: Annotated[date, Query(alias="to")],
) -> list[EventRead]:
    return await service.list_events(start, end)


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(service: ServiceDep, data: EventCreate) -> EventRead:
    return await service.create_event(data)


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(service: ServiceDep, event_id: int, data: EventUpdate) -> EventRead:
    return await service.update_event(event_id, data)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(service: ServiceDep, event_id: int) -> None:
    """Moves the event to the trash."""
    await service.delete_event(event_id, datetime.now(UTC))
