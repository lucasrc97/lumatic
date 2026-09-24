from datetime import datetime

from pydantic import BaseModel, Field


class TrashItemRead(BaseModel):
    module: str
    id: int
    title: str
    deleted_at: datetime
    purge_at: datetime = Field(description="When the item will be permanently deleted.")


class TrashPurgeResult(BaseModel):
    purged: int
