from datetime import date, datetime, time
from typing import Annotated, Self

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

from events.domain.entities import Event


def _blank_to_none(value: str | None) -> str | None:
    return value or None


# Blank descriptions are stored as "no description".
Description = Annotated[str | None, Field(max_length=2000), AfterValidator(_blank_to_none)]


class EventCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    description: Description = None
    event_date: date
    start_time: time | None = Field(default=None, description="Omit for an all-day event.")
    end_time: time | None = Field(default=None, description="Requires start_time.")


class EventUpdate(BaseModel):
    """Partial update: omitted fields are left unchanged.

    Null clears `description`, `start_time` and `end_time`; it is rejected for the other fields.
    """

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: Description = None
    event_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None

    @model_validator(mode="after")
    def _reject_null_required_fields(self) -> Self:
        for name in ("title", "event_date"):
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"'{name}' cannot be null.")
        return self


class EventRead(BaseModel):
    id: int
    title: str
    description: str | None
    event_date: date
    start_time: time | None
    end_time: time | None
    created_at: datetime

    @classmethod
    def from_entity(cls, event: Event) -> "EventRead":
        return cls(
            id=event.id,
            title=event.title,
            description=event.description,
            event_date=event.event_date,
            start_time=event.start_time,
            end_time=event.end_time,
            created_at=event.created_at,
        )


class TrashedEvent(BaseModel):
    id: int
    title: str
    deleted_at: datetime

    @classmethod
    def from_entity(cls, event: Event) -> "TrashedEvent":
        if event.deleted_at is None:
            raise ValueError(f"Event {event.id} is not in the trash.")
        return cls(id=event.id, title=event.title, deleted_at=event.deleted_at)
