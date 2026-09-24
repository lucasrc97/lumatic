from dataclasses import dataclass
from datetime import date, datetime, time

from events.domain.exceptions import InvalidEventTimeError


@dataclass(frozen=True)
class Event:
    """A scheduled event on one day; without `start_time` it lasts all day.

    An event with `deleted_at` set is in the trash: hidden everywhere until restored or purged.
    """

    id: int
    title: str
    description: str | None
    event_date: date
    start_time: time | None
    end_time: time | None
    created_at: datetime
    deleted_at: datetime | None = None


def check_times(start_time: time | None, end_time: time | None) -> None:
    """An end time needs a start time and cannot be before it."""
    if end_time is None:
        return
    if start_time is None:
        raise InvalidEventTimeError("An end time requires a start time.")
    if end_time < start_time:
        raise InvalidEventTimeError("The end time cannot be before the start time.")
