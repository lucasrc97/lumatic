from dataclasses import dataclass

DEFAULT_TRASH_RETENTION_DAYS = 30
MIN_TRASH_RETENTION_DAYS = 1
MAX_TRASH_RETENTION_DAYS = 365


@dataclass(frozen=True)
class Preferences:
    """App-wide user preferences. There is a single set, as the app has a single user."""

    trash_retention_days: int = DEFAULT_TRASH_RETENTION_DAYS
