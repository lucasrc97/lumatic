from fastapi.testclient import TestClient

BASE = "/api/v1/preferences/preferences"


def test_get_and_update_preferences(client: TestClient) -> None:
    assert client.get(BASE).json() == {"trash_retention_days": 30}

    response = client.patch(BASE, json={"trash_retention_days": 14})

    assert response.status_code == 200
    assert response.json() == {"trash_retention_days": 14}
    assert client.get(BASE).json() == {"trash_retention_days": 14}


def test_invalid_retention_returns_error_envelope(client: TestClient) -> None:
    response = client.patch(BASE, json={"trash_retention_days": 0})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
