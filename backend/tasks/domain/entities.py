import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import StrEnum

from tasks.domain.exceptions import InvalidCustomValueError, InvalidFieldOptionsError

MAX_TEXT_VALUE_LENGTH = 500
MAX_OPTIONS = 50
MAX_OPTION_LENGTH = 50

CustomValue = str | int | float
"""A stored custom field value: text, number, ISO date (`yyyy-MM-dd`) or select option."""


class FieldType(StrEnum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"


@dataclass(frozen=True)
class TaskColumn:
    """A Kanban column. Exactly one column is the "done" column."""

    id: int
    name: str
    color: str
    position: int
    is_done: bool


@dataclass(frozen=True)
class TaskField:
    """A user-defined field every task can fill; `options` is used only by select fields."""

    id: int
    name: str
    type: FieldType
    position: int
    options: tuple[str, ...] = ()


@dataclass(frozen=True)
class Task:
    """A task in one column.

    `completed_at` is set while the task sits in the done column. A task with
    `deleted_at` set is in the trash: hidden everywhere until restored or purged.
    """

    id: int
    title: str
    description: str | None
    due_date: date | None
    column_id: int
    created_at: datetime
    completed_at: datetime | None = None
    deleted_at: datetime | None = None
    custom_values: Mapping[int, CustomValue] = field(default_factory=dict)


def normalize_options(type_: FieldType, options: Sequence[str]) -> tuple[str, ...]:
    """Select fields need 1..MAX_OPTIONS distinct, non-blank options; other types none."""
    cleaned = tuple(option.strip() for option in options)
    if type_ is not FieldType.SELECT:
        if cleaned:
            raise InvalidFieldOptionsError("Only select fields have options.")
        return ()
    if not 1 <= len(cleaned) <= MAX_OPTIONS:
        raise InvalidFieldOptionsError(f"A select field needs between 1 and {MAX_OPTIONS} options.")
    if any(not 1 <= len(option) <= MAX_OPTION_LENGTH for option in cleaned):
        raise InvalidFieldOptionsError(
            f"Options must have between 1 and {MAX_OPTION_LENGTH} characters."
        )
    if len(set(cleaned)) != len(cleaned):
        raise InvalidFieldOptionsError("Options must be unique.")
    return cleaned


def completed_at_for(
    column: TaskColumn, previous: datetime | None, now: datetime
) -> datetime | None:
    """Completion time for a task in `column`: set on entering done, kept, cleared on leaving."""
    if not column.is_done:
        return None
    return previous or now


def validate_custom_value(field_: TaskField, value: object) -> CustomValue | None:
    """Normalize `value` for `field_`; `None` (or blank text) means the value is cleared.

    Raises InvalidCustomValueError when the value does not fit the field type.
    """
    if value is None:
        return None
    match field_.type:
        case FieldType.TEXT:
            if not isinstance(value, str) or len(value.strip()) > MAX_TEXT_VALUE_LENGTH:
                raise InvalidCustomValueError(field_.name)
            return value.strip() or None
        case FieldType.NUMBER:
            # bool is a subclass of int but is not a number here.
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise InvalidCustomValueError(field_.name)
            if not math.isfinite(value):
                raise InvalidCustomValueError(field_.name)
            return value
        case FieldType.DATE:
            if not isinstance(value, str):
                raise InvalidCustomValueError(field_.name)
            try:
                return date.fromisoformat(value).isoformat()
            except ValueError:
                raise InvalidCustomValueError(field_.name) from None
        case FieldType.SELECT:
            if not isinstance(value, str) or value not in field_.options:
                raise InvalidCustomValueError(field_.name)
            return value
