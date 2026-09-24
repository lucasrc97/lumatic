from datetime import UTC, datetime

from tasks.domain.entities import TaskColumn, completed_at_for

NOW = datetime(2026, 9, 24, 12, tzinfo=UTC)
EARLIER = datetime(2026, 9, 20, 9, tzinfo=UTC)
TODO = TaskColumn(1, "To do", "#000000", 0, is_done=False)
DONE = TaskColumn(2, "Done", "#000000", 1, is_done=True)


def test_completed_at_is_set_on_entering_done_kept_while_done_and_cleared_on_leaving() -> None:
    assert completed_at_for(DONE, None, NOW) == NOW
    assert completed_at_for(DONE, EARLIER, NOW) == EARLIER
    assert completed_at_for(TODO, EARLIER, NOW) is None
