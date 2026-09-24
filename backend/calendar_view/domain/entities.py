from dataclasses import dataclass
from datetime import date, time


@dataclass(frozen=True)
class CalendarItem:
    """A dated item owned by some module, identified by (module, item_id).

    Items without `start_time` take the whole day (e.g. task due dates, all-day events).
    """

    module: str
    item_id: int
    title: str
    day: date
    start_time: time | None = None
    end_time: time | None = None
    completed: bool = False
