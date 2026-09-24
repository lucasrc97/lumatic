from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.errors import register_error_handlers
from habits.api.routes import router as habits_router

app = FastAPI(title="Lumatic API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_error_handlers(app)

app.include_router(habits_router)


@app.get("/api/v1/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
