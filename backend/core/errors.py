from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class DomainError(Exception):
    """Base class for business-rule failures raised by module domains and services."""

    code = "domain_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFoundError(DomainError):
    code = "not_found"


class ConflictError(DomainError):
    code = "conflict"


class InvalidInputError(DomainError):
    code = "invalid_input"


_STATUS_BY_ERROR: dict[type[DomainError], int] = {
    NotFoundError: 404,
    ConflictError: 409,
    InvalidInputError: 422,
}


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(_: Request, exc: DomainError) -> JSONResponse:
        status_code = next(
            (status for cls, status in _STATUS_BY_ERROR.items() if isinstance(exc, cls)),
            400,
        )
        return _error_response(status_code, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else {}
        location = ".".join(str(part) for part in first.get("loc", ()))
        message = f"{location}: {first.get('msg', 'invalid request')}"
        return _error_response(422, "validation_error", message)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _error_response(exc.status_code, "http_error", str(exc.detail))

    # Starlette re-raises after this handler, so the traceback is still logged by the server.
    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, __: Exception) -> JSONResponse:
        return _error_response(500, "internal_error", "An unexpected error occurred.")
