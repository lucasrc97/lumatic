from datetime import time

import pytest

from events.domain.entities import check_times
from events.domain.exceptions import InvalidEventTimeError


@pytest.mark.parametrize(
    ("start", "end"),
    [(None, None), (time(9), None), (time(9), time(9)), (time(9), time(10, 30))],
)
def test_valid_times(start: time | None, end: time | None) -> None:
    check_times(start, end)


@pytest.mark.parametrize(("start", "end"), [(None, time(10)), (time(10), time(9, 59))])
def test_invalid_times_are_rejected(start: time | None, end: time) -> None:
    with pytest.raises(InvalidEventTimeError):
        check_times(start, end)
