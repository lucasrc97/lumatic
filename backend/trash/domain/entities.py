from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class TrashItem:
    """A deleted item owned by some module, identified by (module, item_id)."""

    module: str
    item_id: int
    title: str
    deleted_at: datetime
