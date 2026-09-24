from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from preferences.application.dtos import PreferencesRead, PreferencesUpdate
from preferences.application.services import PreferencesService
from preferences.infrastructure.repositories import SqlAlchemyPreferencesRepository

router = APIRouter(prefix="/api/v1/preferences/preferences", tags=["preferences"])


def get_preferences_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PreferencesService:
    return PreferencesService(SqlAlchemyPreferencesRepository(session))


ServiceDep = Annotated[PreferencesService, Depends(get_preferences_service)]


@router.get("", response_model=PreferencesRead)
async def get_preferences(service: ServiceDep) -> PreferencesRead:
    return await service.get_preferences()


@router.patch("", response_model=PreferencesRead)
async def update_preferences(service: ServiceDep, data: PreferencesUpdate) -> PreferencesRead:
    return await service.update_preferences(data)
