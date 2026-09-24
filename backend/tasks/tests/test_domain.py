from datetime import UTC, datetime

import pytest

from tasks.domain.entities import (
    FieldType,
    TaskColumn,
    TaskField,
    completed_at_for,
    normalize_options,
    validate_custom_value,
)
from tasks.domain.exceptions import InvalidCustomValueError, InvalidFieldOptionsError

NOW = datetime(2026, 9, 24, 12, tzinfo=UTC)
EARLIER = datetime(2026, 9, 20, 9, tzinfo=UTC)
TODO = TaskColumn(1, "To do", "#000000", 0, is_done=False)
DONE = TaskColumn(2, "Done", "#000000", 1, is_done=True)


def field(type_: FieldType, options: tuple[str, ...] = ()) -> TaskField:
    return TaskField(1, "Field", type_, 0, options)


def test_completed_at_is_set_on_entering_done_kept_while_done_and_cleared_on_leaving() -> None:
    assert completed_at_for(DONE, None, NOW) == NOW
    assert completed_at_for(DONE, EARLIER, NOW) == EARLIER
    assert completed_at_for(TODO, EARLIER, NOW) is None


@pytest.mark.parametrize(
    ("type_", "options", "raw", "expected"),
    [
        (FieldType.TEXT, (), "  note  ", "note"),
        (FieldType.TEXT, (), "   ", None),
        (FieldType.NUMBER, (), 3, 3),
        (FieldType.NUMBER, (), 2.5, 2.5),
        (FieldType.DATE, (), "2026-09-24", "2026-09-24"),
        (FieldType.SELECT, ("Low", "High"), "High", "High"),
        (FieldType.SELECT, ("Low", "High"), None, None),
    ],
)
def test_valid_custom_values_are_normalized(
    type_: FieldType, options: tuple[str, ...], raw: object, expected: object
) -> None:
    assert validate_custom_value(field(type_, options), raw) == expected


@pytest.mark.parametrize(
    ("type_", "options", "raw"),
    [
        (FieldType.TEXT, (), 3),
        (FieldType.TEXT, (), "x" * 501),
        (FieldType.NUMBER, (), "3"),
        (FieldType.NUMBER, (), True),
        (FieldType.NUMBER, (), float("inf")),
        (FieldType.DATE, (), "24/09/2026"),
        (FieldType.DATE, (), 20260924),
        (FieldType.SELECT, ("Low", "High"), "Medium"),
    ],
)
def test_invalid_custom_values_are_rejected(
    type_: FieldType, options: tuple[str, ...], raw: object
) -> None:
    with pytest.raises(InvalidCustomValueError):
        validate_custom_value(field(type_, options), raw)


def test_select_options_are_trimmed_and_other_types_have_none() -> None:
    assert normalize_options(FieldType.SELECT, [" Low ", "High"]) == ("Low", "High")
    assert normalize_options(FieldType.TEXT, []) == ()


@pytest.mark.parametrize(
    ("type_", "options"),
    [
        (FieldType.SELECT, []),
        (FieldType.SELECT, ["Low", "Low"]),
        (FieldType.SELECT, ["  "]),
        (FieldType.SELECT, [str(n) for n in range(51)]),
        (FieldType.NUMBER, ["1"]),
    ],
)
def test_invalid_options_are_rejected(type_: FieldType, options: list[str]) -> None:
    with pytest.raises(InvalidFieldOptionsError):
        normalize_options(type_, options)
