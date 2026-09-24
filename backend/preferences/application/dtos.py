from pydantic import BaseModel, ConfigDict, Field

from preferences.domain.entities import (
    MAX_TRASH_RETENTION_DAYS,
    MIN_TRASH_RETENTION_DAYS,
    Preferences,
)


class PreferencesUpdate(BaseModel):
    """Partial update: omitted or null fields are left unchanged."""

    model_config = ConfigDict(extra="forbid")

    trash_retention_days: int | None = Field(
        default=None, ge=MIN_TRASH_RETENTION_DAYS, le=MAX_TRASH_RETENTION_DAYS
    )


class PreferencesRead(BaseModel):
    trash_retention_days: int

    @classmethod
    def from_entity(cls, preferences: Preferences) -> "PreferencesRead":
        return cls(trash_retention_days=preferences.trash_retention_days)
