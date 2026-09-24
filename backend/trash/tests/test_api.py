from fastapi.testclient import TestClient

BASE = "/api/v1/trash/items"


def test_empty_trash_lists_nothing(client: TestClient) -> None:
    response = client.get(BASE)

    assert response.status_code == 200
    assert response.json() == []
    assert client.delete(BASE).json() == {"purged": 0}


def test_unknown_module_returns_404_error_envelope(client: TestClient) -> None:
    response = client.post(f"{BASE}/nope/1/restore")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "trash_module_not_found"
