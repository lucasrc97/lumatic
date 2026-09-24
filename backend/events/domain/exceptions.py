from core.errors import InvalidInputError, NotFoundError


class EventNotFoundError(NotFoundError):
    code = "event_not_found"

    def __init__(self, event_id: int) -> None:
        super().__init__(f"Event {event_id} was not found.")


class InvalidEventTimeError(InvalidInputError):
    code = "invalid_event_time"


class InvalidDateRangeError(InvalidInputError):
    code = "invalid_date_range"
