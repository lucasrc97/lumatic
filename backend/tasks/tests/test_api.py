from fastapi.testclient import TestClient

from tasks.tests.conftest import DOING, DONE, TODO

BASE = "/api/v1/tasks"


def create_task(client: TestClient, **payload: object) -> dict[str, object]:
    response = client.post(f"{BASE}/tasks", json={"title": "Pay rent", **payload})
    assert response.status_code == 201
    task: dict[str, object] = response.json()
    return task


def test_create_list_update_and_delete_task(client: TestClient) -> None:
    task = create_task(client, due_date="2026-09-30")

    assert client.get(f"{BASE}/tasks").json() == [task]
    assert task["column_id"] == TODO

    response = client.patch(f"{BASE}/tasks/{task['id']}", json={"column_id": DONE})
    assert response.status_code == 200
    assert response.json()["completed_at"] is not None

    response = client.patch(f"{BASE}/tasks/{task['id']}", json={"due_date": None})
    assert response.json()["due_date"] is None

    assert client.delete(f"{BASE}/tasks/{task['id']}").status_code == 204
    assert client.get(f"{BASE}/tasks").json() == []
    assert client.delete(f"{BASE}/tasks/{task['id']}").status_code == 404


def test_null_title_is_rejected(client: TestClient) -> None:
    task = create_task(client)

    response = client.patch(f"{BASE}/tasks/{task['id']}", json={"title": None})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_priority_is_set_and_validated(client: TestClient) -> None:
    task = create_task(client, priority="high")

    lowered = client.patch(f"{BASE}/tasks/{task['id']}", json={"priority": "low"})
    invalid = client.patch(f"{BASE}/tasks/{task['id']}", json={"priority": "urgent"})

    assert task["priority"] == "high"
    assert create_task(client)["priority"] == "none"
    assert lowered.json()["priority"] == "low"
    assert invalid.status_code == 422


def test_columns_crud_and_order(client: TestClient) -> None:
    created = client.post(f"{BASE}/columns", json={"name": "Waiting", "color": "#ff0000"})
    assert created.status_code == 201
    column_id = created.json()["id"]

    order = [column_id, TODO, DOING, DONE]
    response = client.put(f"{BASE}/columns/order", json={"ids": order})
    assert [c["id"] for c in response.json()] == order

    renamed = client.patch(f"{BASE}/columns/{column_id}", json={"name": "Blocked"})
    assert renamed.json()["name"] == "Blocked"

    assert client.delete(f"{BASE}/columns/{column_id}").status_code == 204
    assert [c["id"] for c in client.get(f"{BASE}/columns").json()] == [TODO, DOING, DONE]


def test_column_rules_return_conflict_codes(client: TestClient) -> None:
    create_task(client, column_id=DOING)

    not_empty = client.delete(f"{BASE}/columns/{DOING}")
    done = client.delete(f"{BASE}/columns/{DONE}")
    bad_order = client.put(f"{BASE}/columns/order", json={"ids": [TODO]})

    assert not_empty.status_code == 409
    assert not_empty.json()["error"]["code"] == "task_column_not_empty"
    assert done.status_code == 409
    assert done.json()["error"]["code"] == "task_done_column_required"
    assert bad_order.status_code == 422
    assert bad_order.json()["error"]["code"] == "invalid_task_order"
