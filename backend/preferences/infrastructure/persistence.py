from sqlalchemy import CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from preferences.domain.entities import (
    DEFAULT_TRASH_RETENTION_DAYS,
    MAX_TRASH_RETENTION_DAYS,
    MIN_TRASH_RETENTION_DAYS,
)

SINGLETON_ID = 1


class PreferencesModel(Base):
    """Single-row table: the CHECK on `id` guarantees there is only one preferences row."""

    __tablename__ = "preferences_preferences"
    __table_args__ = (
        CheckConstraint(f"id = {SINGLETON_ID}", name="single_row"),
        CheckConstraint(
            "trash_retention_days BETWEEN "
            f"{MIN_TRASH_RETENTION_DAYS} AND {MAX_TRASH_RETENTION_DAYS}",
            name="trash_retention_days_range",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    trash_retention_days: Mapped[int] = mapped_column(
        server_default=str(DEFAULT_TRASH_RETENTION_DAYS)
    )
