import asyncio
import contextlib
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.errors import register_error_handlers
from habits.api.routes import router as habits_router
from preferences.api.routes import router as preferences_router
from tasks.api.routes import router as tasks_router
from trash.api.routes import router as trash_router
from trash.infrastructure.scheduler import run_trash_purge_loop


@contextlib.asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    purge_task = asyncio.create_task(run_trash_purge_loop()) if settings.trash_auto_purge else None
    yield
    if purge_task is not None:
        purge_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await purge_task


app = FastAPI(title="Lumatic API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_error_handlers(app)

app.include_router(habits_router)
app.include_router(preferences_router)
app.include_router(tasks_router)
app.include_router(trash_router)


@app.get("/api/v1/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
