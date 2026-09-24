from core.errors import ConflictError, InvalidInputError, NotFoundError


class HabitNotFoundError(NotFoundError):
    code = "habit_not_found"

    def __init__(self, habit_id: int) -> None:
        super().__init__(f"Habit {habit_id} was not found.")


class HabitArchivedError(ConflictError):
    code = "habit_archived"

    def __init__(self, habit_id: int) -> None:
        super().__init__(f"Habit {habit_id} is archived and cannot be changed.")


class InvalidDateRangeError(InvalidInputError):
    code = "invalid_date_range"
