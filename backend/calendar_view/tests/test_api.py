from collections.abc import Iterator
from datetime import date, time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from calendar_view.api.routes import get_calendar_service
from calendar_view.application.services import CalendarService
from calendar_view.domain.entities import CalendarItem
from calendar_view.tests.test_services import FakeCalendarSource

BASE = "/api/v1/calendar/items"


@pytest.fixture
def client() -> Iterator[TestClient]:
    source = FakeCalendarSource(
        "events", [CalendarItem("events", 1, "Dentist", date(2026, 9, 25), time(15))]
    )
    app.dependency_overrides[get_calendar_service] = lambda: CalendarService([source])
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_lists_items_in_range(client: TestClient) -> None:
    response = client.get(BASE, params={"from": "2026-09-01", "to": "2026-09-30"})

    assert response.status_code == 200
    assert response.json() == [
        {
            "module": "events",
            "id": 1,
            "title": "Dentist",
            "date": "2026-09-25",
            "start_time": "15:00:00",
            "end_time": None,
            "completed": False,
        }
    ]


def test_inverted_range_returns_422_error_code(client: TestClient) -> None:
    response = client.get(BASE, params={"from": "2026-09-30", "to": "2026-09-01"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_date_range"
