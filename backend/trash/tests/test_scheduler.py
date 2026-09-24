import asyncio

import pytest

from trash.infrastructure import scheduler


async def test_purge_loop_keeps_running_after_a_failed_run(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    outcomes: list[int | Exception] = [RuntimeError("database down"), 2]
    calls = asyncio.Event()

    async def fake_purge() -> int:
        outcome = outcomes.pop(0)
        if not outcomes:
            calls.set()
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    monkeypatch.setattr(scheduler, "purge_expired_trash", fake_purge)

    with caplog.at_level("INFO", logger=scheduler.__name__):
        task = asyncio.create_task(scheduler.run_trash_purge_loop(interval_seconds=0))
        await asyncio.wait_for(calls.wait(), timeout=1)
        await asyncio.sleep(0)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    assert "Automatic trash purge failed" in caplog.text
    assert "Purged 2 expired trash item(s)." in caplog.text
