from collections.abc import Sequence
from datetime import date, time

from calendar_view.application.dtos import CalendarItemRead
from calendar_view.domain.exceptions import InvalidDateRangeError
from calendar_view.domain.sources import CalendarSource

# A month view spans at most six weeks; a little headroom covers other layouts.
MAX_RANGE_DAYS = 62


class CalendarService:
    def __init__(self, sources: Sequence[CalendarSource]) -> None:
        self._sources = sources

    async def list_items(self, start: date, end: date) -> list[CalendarItemRead]:
        """Items from every module within [start, end], by day, all-day first, then time."""
        if start > end:
            raise InvalidDateRangeError("'from' must be on or before 'to'.")
        if (end - start).days >= MAX_RANGE_DAYS:
            raise InvalidDateRangeError(f"Date range cannot exceed {MAX_RANGE_DAYS} days.")
        items = [
            item for source in self._sources for item in await source.items_between(start, end)
        ]
        items.sort(
            key=lambda i: (i.day, i.start_time is not None, i.start_time or time(), i.module)
        )
        return [
            CalendarItemRead(
                module=item.module,
                id=item.item_id,
                title=item.title,
                date=item.day,
                start_time=item.start_time,
                end_time=item.end_time,
                completed=item.completed,
            )
            for item in items
        ]
