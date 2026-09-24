import datetime as dt

from pydantic import BaseModel, Field


class CalendarItemRead(BaseModel):
    module: str = Field(description="Owning module, e.g. `events` or `tasks`.")
    id: int
    title: str
    date: dt.date
    start_time: dt.time | None
    end_time: dt.time | None
    completed: bool = Field(description="For tasks: whether the task is done.")
