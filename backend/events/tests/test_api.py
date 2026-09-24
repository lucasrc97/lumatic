from fastapi.testclient import TestClient

BASE = "/api/v1/events/events"
SEPT = {"from": "2026-09-01", "to": "2026-09-30"}


def test_create_list_update_and_delete_event(client: TestClient) -> None:
    created = client.post(
        BASE,
        json={
            "title": "Dentist",
            "description": "Bring exams",
            "event_date": "2026-09-25",
            "start_time": "15:00",
            "end_time": "16:30",
        },
    )
    assert created.status_code == 201
    event = created.json()
    assert (event["start_time"], event["end_time"]) == ("15:00:00", "16:30:00")

    assert client.get(BASE, params=SEPT).json() == [event]

    updated = client.patch(f"{BASE}/{event['id']}", json={"end_time": None})
    assert updated.json()["end_time"] is None

    assert client.delete(f"{BASE}/{event['id']}").status_code == 204
    assert client.get(BASE, params=SEPT).json() == []
    assert client.delete(f"{BASE}/{event['id']}").status_code == 404


def test_invalid_times_return_422_error_code(client: TestClient) -> None:
    response = client.post(
        BASE,
        json={"title": "x", "event_date": "2026-09-25", "start_time": "10:00", "end_time": "09:00"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_event_time"


def test_missing_date_and_null_title_are_rejected(client: TestClient) -> None:
    assert client.post(BASE, json={"title": "x"}).status_code == 422
    event_id = client.post(BASE, json={"title": "x", "event_date": "2026-09-25"}).json()["id"]

    response = client.patch(f"{BASE}/{event_id}", json={"title": None})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
