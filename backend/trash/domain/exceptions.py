from core.errors import NotFoundError


class TrashModuleNotFoundError(NotFoundError):
    code = "trash_module_not_found"

    def __init__(self, module: str) -> None:
        super().__init__(f"Module '{module}' has no trash.")
