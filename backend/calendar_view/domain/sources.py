from datetime import date
from typing import Protocol

from calendar_view.domain.entities import CalendarItem


class CalendarSource(Protocol):
    """Contract each module with dated items implements to show up in the calendar.

    The calendar owns no tables and never writes: every module keeps its own data and
    exposes the items of a date range through its service; a source adapts that service.
    """

    module: str

    async def items_between(self, start: date, end: date) -> list[CalendarItem]:
        """The module's items dated within [start, end]."""
        ...
