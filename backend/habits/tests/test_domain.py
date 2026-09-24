from datetime import date, timedelta

from habits.domain.entities import current_streak, longest_streak

TODAY = date(2026, 9, 24)


def days_ago(*offsets: int) -> list[date]:
    return [TODAY - timedelta(days=offset) for offset in offsets]


def test_current_streak_is_zero_without_entries() -> None:
    assert current_streak([], TODAY) == 0


def test_current_streak_counts_consecutive_days_ending_today() -> None:
    assert current_streak(days_ago(0, 1, 2), TODAY) == 3


def test_current_streak_stays_alive_when_today_is_not_done_yet() -> None:
    assert current_streak(days_ago(1, 2), TODAY) == 2


def test_current_streak_breaks_on_a_missed_day() -> None:
    assert current_streak(days_ago(0, 1, 3, 4, 5), TODAY) == 2
    assert current_streak(days_ago(2, 3), TODAY) == 0


def test_current_streak_ignores_future_entries() -> None:
    assert current_streak([TODAY + timedelta(days=1), TODAY], TODAY) == 1


def test_longest_streak_finds_the_longest_run() -> None:
    assert longest_streak(days_ago(0, 1, 5, 6, 7, 8, 10)) == 4


def test_longest_streak_handles_empty_and_duplicate_dates() -> None:
    assert longest_streak([]) == 0
    assert longest_streak(days_ago(0, 0, 1)) == 2
