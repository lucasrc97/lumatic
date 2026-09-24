from fastapi.testclient import TestClient

BASE = "/api/v1/habits/habits"
WEEK = {"from": "2026-09-21", "to": "2026-09-27", "today": "2026-09-24"}


def create_habit(client: TestClient, name: str = "Read") -> int:
    response = client.post(BASE, json={"name": name})
    assert response.status_code == 201
    habit_id: int = response.json()["id"]
    return habit_id


def test_create_and_list_habits(client: TestClient) -> None:
    habit_id = create_habit(client)

    response = client.get(BASE, params=WEEK)

    assert response.status_code == 200
    [habit] = response.json()
    assert habit["id"] == habit_id
    assert habit["name"] == "Read"
    assert habit["color"] == "#22c55e"
    assert habit["current_streak"] == 0


def test_complete_and_uncomplete_day(client: TestClient) -> None:
    habit_id = create_habit(client)

    assert client.put(f"{BASE}/{habit_id}/entries/2026-09-24").status_code == 204
    [habit] = client.get(BASE, params=WEEK).json()
    assert habit["completed_dates"] == ["2026-09-24"]
    assert habit["current_streak"] == 1

    assert client.delete(f"{BASE}/{habit_id}/entries/2026-09-24").status_code == 204
    [habit] = client.get(BASE, params=WEEK).json()
    assert habit["completed_dates"] == []


def test_patch_archives_habit(client: TestClient) -> None:
    habit_id = create_habit(client)

    response = client.patch(f"{BASE}/{habit_id}", json={"archived": True})

    assert response.status_code == 200
    assert response.json()["archived"] is True
    assert client.get(BASE, params=WEEK).json() == []


def test_invalid_payload_returns_error_envelope(client: TestClient) -> None:
    response = client.post(BASE, json={"name": "", "color": "red"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_unknown_habit_returns_404_error_envelope(client: TestClient) -> None:
    response = client.put(f"{BASE}/999/entries/2026-09-24")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "habit_not_found", "message": "Habit 999 was not found."}
    }


def test_archived_habit_entry_returns_409(client: TestClient) -> None:
    habit_id = create_habit(client)
    client.patch(f"{BASE}/{habit_id}", json={"archived": True})

    response = client.put(f"{BASE}/{habit_id}/entries/2026-09-24")

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "habit_archived"


def test_inverted_date_range_returns_422(client: TestClient) -> None:
    response = client.get(BASE, params={"from": "2026-09-27", "to": "2026-09-21"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_date_range"
