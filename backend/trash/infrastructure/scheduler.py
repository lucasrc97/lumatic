import asyncio
import logging
from datetime import UTC, datetime

from core.database import SessionFactory
from trash.infrastructure.sources import build_trash_service

logger = logging.getLogger(__name__)

PURGE_INTERVAL_SECONDS = 24 * 60 * 60


async def purge_expired_trash() -> int:
    async with SessionFactory() as session:
        result = await build_trash_service(session).purge_expired(datetime.now(UTC))
    return result.purged


async def run_trash_purge_loop(interval_seconds: float = PURGE_INTERVAL_SECONDS) -> None:
    """Purge expired trash now and then every `interval_seconds`, until cancelled.

    A failed run is logged and retried on the next tick so a transient database
    error does not stop automatic purging for the rest of the process lifetime.
    """
    while True:
        try:
            purged = await purge_expired_trash()
            if purged:
                logger.info("Purged %d expired trash item(s).", purged)
        except Exception:
            logger.exception("Automatic trash purge failed; retrying on the next run.")
        await asyncio.sleep(interval_seconds)
