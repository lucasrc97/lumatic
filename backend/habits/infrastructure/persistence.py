from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, false, func
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class HabitModel(Base):
    __tablename__ = "habits_habits"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    color: Mapped[str] = mapped_column(String(7))
    archived: Mapped[bool] = mapped_column(default=False, server_default=false())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class HabitEntryModel(Base):
    """One row per habit per completed day; the composite key keeps entries unique."""

    __tablename__ = "habits_entries"

    habit_id: Mapped[int] = mapped_column(
        ForeignKey("habits_habits.id", ondelete="CASCADE"), primary_key=True
    )
    entry_date: Mapped[date] = mapped_column(Date, primary_key=True)
