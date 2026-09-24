from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from calendar_view.application.dtos import CalendarItemRead
from calendar_view.application.services import CalendarService
from calendar_view.infrastructure.sources import build_calendar_service
from core.database import get_session

router = APIRouter(prefix="/api/v1/calendar/items", tags=["calendar"])


def get_calendar_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CalendarService:
    return build_calendar_service(session)


ServiceDep = Annotated[CalendarService, Depends(get_calendar_service)]


@router.get("", response_model=list[CalendarItemRead])
async def list_items(
    service: ServiceDep,
    start: Annotated[date, Query(alias="from")],
    end: Annotated[date, Query(alias="to")],
) -> list[CalendarItemRead]:
    """Dated items from every module: events and task due dates."""
    return await service.list_items(start, end)
