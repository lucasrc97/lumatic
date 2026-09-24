from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from habits.domain.entities import Habit

HEX_COLOR_PATTERN = r"^#[0-9a-fA-F]{6}$"
DEFAULT_COLOR = "#22c55e"


class HabitCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    color: str = Field(default=DEFAULT_COLOR, pattern=HEX_COLOR_PATTERN)


class HabitUpdate(BaseModel):
    """Partial update: omitted or null fields are left unchanged."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = Field(default=None, pattern=HEX_COLOR_PATTERN)
    archived: bool | None = None


class HabitRead(BaseModel):
    id: int
    name: str
    color: str
    archived: bool
    created_at: datetime

    @classmethod
    def from_entity(cls, habit: Habit) -> "HabitRead":
        return cls(
            id=habit.id,
            name=habit.name,
            color=habit.color,
            archived=habit.archived,
            created_at=habit.created_at,
        )


class TrashedHabit(BaseModel):
    id: int
    name: str
    deleted_at: datetime

    @classmethod
    def from_entity(cls, habit: Habit) -> "TrashedHabit":
        if habit.deleted_at is None:
            raise ValueError(f"Habit {habit.id} is not in the trash.")
        return cls(id=habit.id, name=habit.name, deleted_at=habit.deleted_at)


class HabitProgress(HabitRead):
    current_streak: int
    longest_streak: int
    completed_dates: list[date] = Field(
        description="Completed dates within the requested range, ascending."
    )
