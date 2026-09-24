from datetime import date, datetime
from typing import Annotated, Self

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    StrictFloat,
    StrictInt,
    StrictStr,
    model_validator,
)

from tasks.domain.entities import CustomValue, FieldType, Task, TaskColumn, TaskField

HEX_COLOR_PATTERN = r"^#[0-9a-fA-F]{6}$"
DEFAULT_COLUMN_COLOR = "#94a3b8"

# Values are checked against each field's type by the service; null clears a value.
CustomValueInput = StrictStr | StrictInt | StrictFloat | None
CustomValuesInput = Annotated[
    dict[int, CustomValueInput],
    Field(description="Values keyed by field id; null clears the value."),
]


def _blank_to_none(value: str | None) -> str | None:
    return value or None


# Blank descriptions are stored as "no description".
Description = Annotated[str | None, Field(max_length=2000), AfterValidator(_blank_to_none)]


class TaskCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    description: Description = None
    due_date: date | None = None
    column_id: int | None = Field(default=None, description="Defaults to the first column.")
    custom_values: CustomValuesInput = Field(default_factory=dict)


class TaskUpdate(BaseModel):
    """Partial update: omitted fields are left unchanged.

    Null clears `description` and `due_date`; it is rejected for the other fields.
    `custom_values` is merged into the task's values (null removes a value).
    """

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: Description = None
    due_date: date | None = None
    column_id: int | None = None
    custom_values: CustomValuesInput | None = None

    @model_validator(mode="after")
    def _reject_null_required_fields(self) -> Self:
        for name in ("title", "column_id", "custom_values"):
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"'{name}' cannot be null.")
        return self


class TaskRead(BaseModel):
    id: int
    title: str
    description: str | None
    due_date: date | None
    column_id: int
    custom_values: dict[int, CustomValue]
    completed_at: datetime | None
    created_at: datetime

    @classmethod
    def from_entity(cls, task: Task) -> "TaskRead":
        return cls(
            id=task.id,
            title=task.title,
            description=task.description,
            due_date=task.due_date,
            column_id=task.column_id,
            custom_values=dict(task.custom_values),
            completed_at=task.completed_at,
            created_at=task.created_at,
        )


class TrashedTask(BaseModel):
    id: int
    title: str
    deleted_at: datetime

    @classmethod
    def from_entity(cls, task: Task) -> "TrashedTask":
        if task.deleted_at is None:
            raise ValueError(f"Task {task.id} is not in the trash.")
        return cls(id=task.id, title=task.title, deleted_at=task.deleted_at)


class ColumnCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str = Field(min_length=1, max_length=50)
    color: str = Field(default=DEFAULT_COLUMN_COLOR, pattern=HEX_COLOR_PATTERN)


class ColumnUpdate(BaseModel):
    """Partial update: omitted or null fields are left unchanged.

    `is_done: true` makes this the done column (the previous one stops being done).
    """

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=50)
    color: str | None = Field(default=None, pattern=HEX_COLOR_PATTERN)
    is_done: bool | None = None


class ColumnRead(BaseModel):
    id: int
    name: str
    color: str
    position: int
    is_done: bool

    @classmethod
    def from_entity(cls, column: TaskColumn) -> "ColumnRead":
        return cls(
            id=column.id,
            name=column.name,
            color=column.color,
            position=column.position,
            is_done=column.is_done,
        )


class FieldCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str = Field(min_length=1, max_length=50)
    type: FieldType
    options: list[str] = Field(default_factory=list, description="Only for select fields.")


class FieldUpdate(BaseModel):
    """Partial update: omitted or null fields are left unchanged; the type cannot change.

    Removing a select option clears that value from every task.
    """

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=50)
    options: list[str] | None = None


class FieldRead(BaseModel):
    id: int
    name: str
    type: FieldType
    options: list[str]
    position: int

    @classmethod
    def from_entity(cls, field: TaskField) -> "FieldRead":
        return cls(
            id=field.id,
            name=field.name,
            type=field.type,
            options=list(field.options),
            position=field.position,
        )


class OrderUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ids: list[int] = Field(description="Every id, in the new order.")
