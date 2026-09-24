from core.errors import InvalidInputError


class InvalidDateRangeError(InvalidInputError):
    code = "invalid_date_range"
