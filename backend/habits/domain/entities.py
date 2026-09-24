from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, datetime, timedelta

_ONE_DAY = timedelta(days=1)


@dataclass(frozen=True)
class Habit:
    """A daily habit. Completions are stored separately as one entry per date.

    A habit with `deleted_at` set is in the trash: hidden everywhere until restored or purged.
    """

    id: int
    name: str
    color: str
    archived: bool
    created_at: datetime
    deleted_at: datetime | None = None


def current_streak(completed: Iterable[date], today: date) -> int:
    """Consecutive completed days ending today, or yesterday if today is not done yet."""
    days = set(completed)
    cursor = today if today in days else today - _ONE_DAY
    streak = 0
    while cursor in days:
        streak += 1
        cursor -= _ONE_DAY
    return streak


def longest_streak(completed: Iterable[date]) -> int:
    best = run = 0
    previous: date | None = None
    for day in sorted(set(completed)):
        run = run + 1 if previous is not None and day - previous == _ONE_DAY else 1
        best = max(best, run)
        previous = day
    return best
