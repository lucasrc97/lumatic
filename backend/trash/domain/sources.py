from datetime import datetime
from typing import Protocol

from trash.domain.entities import TrashItem


class TrashSource(Protocol):
    """Contract each module with deletable items implements to take part in the trash.

    The trash owns no tables: every module keeps its trashed rows (soft-deleted) and
    exposes them through its own service; a source adapts that service to this contract.
    """

    module: str

    async def list_items(self) -> list[TrashItem]: ...

    async def restore(self, item_id: int) -> None:
        """Raises the module's not-found error if the item is not in the trash."""
        ...

    async def purge(self, item_id: int) -> None:
        """Raises the module's not-found error if the item is not in the trash."""
        ...

    async def purge_deleted_before(self, cutoff: datetime) -> int: ...
