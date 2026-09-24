from core.errors import ConflictError, InvalidInputError, NotFoundError


class TaskNotFoundError(NotFoundError):
    code = "task_not_found"

    def __init__(self, task_id: int) -> None:
        super().__init__(f"Task {task_id} was not found.")


class TaskColumnNotFoundError(NotFoundError):
    code = "task_column_not_found"

    def __init__(self, column_id: int) -> None:
        super().__init__(f"Column {column_id} was not found.")


class TaskFieldNotFoundError(NotFoundError):
    code = "task_field_not_found"

    def __init__(self, field_id: int) -> None:
        super().__init__(f"Field {field_id} was not found.")


class TaskColumnNotEmptyError(ConflictError):
    code = "task_column_not_empty"

    def __init__(self, column_id: int) -> None:
        super().__init__(f"Column {column_id} still has tasks; move them before deleting it.")


class DoneColumnRequiredError(ConflictError):
    code = "task_done_column_required"

    def __init__(self) -> None:
        super().__init__(
            "There must always be a done column; mark another column as done first."
        )


class InvalidCustomValueError(InvalidInputError):
    code = "invalid_task_custom_value"

    def __init__(self, field_name: str) -> None:
        super().__init__(f"Invalid value for field '{field_name}'.")


class UnknownCustomFieldError(InvalidInputError):
    code = "unknown_task_field"

    def __init__(self, field_id: int) -> None:
        super().__init__(f"Field {field_id} does not exist.")


class InvalidOrderError(InvalidInputError):
    code = "invalid_task_order"

    def __init__(self) -> None:
        super().__init__("The order must list every existing id exactly once.")


class InvalidFieldOptionsError(InvalidInputError):
    code = "invalid_task_field_options"
