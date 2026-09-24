from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from tasks.application.dtos import (
    ColumnCreate,
    ColumnRead,
    ColumnUpdate,
    FieldCreate,
    FieldRead,
    FieldUpdate,
    OrderUpdate,
    TaskCreate,
    TaskRead,
    TaskUpdate,
)
from tasks.application.services import TaskService
from tasks.infrastructure.repositories import SqlAlchemyTaskRepository

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


def get_task_service(session: Annotated[AsyncSession, Depends(get_session)]) -> TaskService:
    return TaskService(SqlAlchemyTaskRepository(session))


ServiceDep = Annotated[TaskService, Depends(get_task_service)]


# Tasks


@router.get("/tasks", response_model=list[TaskRead])
async def list_tasks(service: ServiceDep) -> list[TaskRead]:
    return await service.list_tasks()


@router.post("/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(service: ServiceDep, data: TaskCreate) -> TaskRead:
    return await service.create_task(data, datetime.now(UTC))


@router.patch("/tasks/{task_id}", response_model=TaskRead)
async def update_task(service: ServiceDep, task_id: int, data: TaskUpdate) -> TaskRead:
    return await service.update_task(task_id, data, datetime.now(UTC))


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(service: ServiceDep, task_id: int) -> None:
    """Moves the task to the trash."""
    await service.delete_task(task_id, datetime.now(UTC))


# Columns


@router.get("/columns", response_model=list[ColumnRead])
async def list_columns(service: ServiceDep) -> list[ColumnRead]:
    return await service.list_columns()


@router.post("/columns", response_model=ColumnRead, status_code=status.HTTP_201_CREATED)
async def create_column(service: ServiceDep, data: ColumnCreate) -> ColumnRead:
    return await service.create_column(data)


@router.put("/columns/order", response_model=list[ColumnRead])
async def reorder_columns(service: ServiceDep, data: OrderUpdate) -> list[ColumnRead]:
    return await service.reorder_columns(data.ids)


@router.patch("/columns/{column_id}", response_model=ColumnRead)
async def update_column(service: ServiceDep, column_id: int, data: ColumnUpdate) -> ColumnRead:
    return await service.update_column(column_id, data, datetime.now(UTC))


@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(service: ServiceDep, column_id: int) -> None:
    await service.delete_column(column_id, datetime.now(UTC))


# Fields


@router.get("/fields", response_model=list[FieldRead])
async def list_fields(service: ServiceDep) -> list[FieldRead]:
    return await service.list_fields()


@router.post("/fields", response_model=FieldRead, status_code=status.HTTP_201_CREATED)
async def create_field(service: ServiceDep, data: FieldCreate) -> FieldRead:
    return await service.create_field(data)


@router.put("/fields/order", response_model=list[FieldRead])
async def reorder_fields(service: ServiceDep, data: OrderUpdate) -> list[FieldRead]:
    return await service.reorder_fields(data.ids)


@router.patch("/fields/{field_id}", response_model=FieldRead)
async def update_field(service: ServiceDep, field_id: int, data: FieldUpdate) -> FieldRead:
    return await service.update_field(field_id, data)


@router.delete("/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_field(service: ServiceDep, field_id: int) -> None:
    """Deletes the field and its value in every task."""
    await service.delete_field(field_id)
