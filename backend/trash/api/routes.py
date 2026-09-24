from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from trash.application.dtos import TrashItemRead, TrashPurgeResult
from trash.application.services import TrashService
from trash.infrastructure.sources import build_trash_service

router = APIRouter(prefix="/api/v1/trash/items", tags=["trash"])


def get_trash_service(session: Annotated[AsyncSession, Depends(get_session)]) -> TrashService:
    return build_trash_service(session)


ServiceDep = Annotated[TrashService, Depends(get_trash_service)]


@router.get("", response_model=list[TrashItemRead])
async def list_items(service: ServiceDep) -> list[TrashItemRead]:
    return await service.list_items()


@router.delete("", response_model=TrashPurgeResult)
async def empty_trash(service: ServiceDep) -> TrashPurgeResult:
    """Permanently deletes every item in the trash."""
    return await service.empty()


@router.post("/{module}/{item_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_item(service: ServiceDep, module: str, item_id: int) -> None:
    await service.restore(module, item_id)


@router.delete("/{module}/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def purge_item(service: ServiceDep, module: str, item_id: int) -> None:
    await service.purge(module, item_id)
