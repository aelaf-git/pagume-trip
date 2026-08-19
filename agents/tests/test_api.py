from fastapi.testclient import TestClient

from pagume_agents.api.app import create_app
from pagume_agents.clients.mock import MockInventoryClient
from pagume_agents.graph import build_graph
from tests.scenario import GORGORA_MESSAGE


def test_health_and_gorgora_run():
    client = MockInventoryClient()
    graph = build_graph(client=client, use_llm=False)
    app = create_app(graph=graph)
    http = TestClient(app)
    assert http.get("/health").json() == {"status": "ok"}
    response = http.post(
        "/v1/runs",
        json={"thread_id": "api-gorgora", "message": GORGORA_MESSAGE},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["selected_option"]["total_etb"] == 44000
    assert "Gorgora" in (body["message"] or "")
    events = http.get("/v1/runs/api-gorgora/events")
    assert events.status_code == 200
    assert "event: agent" in events.text


def test_post_runs_same_thread_remembers_history():
    client = MockInventoryClient()
    graph = build_graph(client=client, use_llm=False)
    http = TestClient(create_app(graph=graph))
    first = http.post(
        "/v1/runs",
        json={"thread_id": "reuse-thread", "message": "Hey I am Aelaf who are you?"},
    )
    assert first.status_code == 200
    second = http.post(
        "/v1/runs",
        json={"thread_id": "reuse-thread", "message": "Plan two days in Lalibela for two people."},
    )
    assert second.status_code == 200
    body = second.json()
    user_turns = [m["content"] for m in body["messages"] if m["role"] == "user"]
    assert user_turns == [
        "Hey I am Aelaf who are you?",
        "Plan two days in Lalibela for two people.",
    ]
    assert "Lalibela" in (body["message"] or "")


def test_post_runs_reset_wipes_thread():
    client = MockInventoryClient()
    graph = build_graph(client=client, use_llm=False)
    http = TestClient(create_app(graph=graph))
    first = http.post(
        "/v1/runs",
        json={"thread_id": "reset-thread", "message": GORGORA_MESSAGE},
    )
    assert first.status_code == 200
    assert "Gorgora" in (first.json()["message"] or "")
    second = http.post(
        "/v1/runs",
        json={
            "thread_id": "reset-thread",
            "message": "Plan two days in Lalibela for two people.",
            "reset": True,
        },
    )
    assert second.status_code == 200
    body = second.json()
    assert "Lalibela" in (body["message"] or "")
    assert "Gorgora" not in (body["message"] or "")
    assert len([m for m in body["messages"] if m["role"] == "user"]) == 1


def test_greeting_does_not_return_unavailable():
    client = MockInventoryClient()
    graph = build_graph(client=client, use_llm=False)
    http = TestClient(create_app(graph=graph))
    response = http.post(
        "/v1/runs",
        json={"thread_id": "api-hello", "message": "Hey I am Aelaf who are you?"},
    )
    assert response.status_code == 200
    message = (response.json()["message"] or "").lower()
    assert "couldn't find a verified match" not in message
    assert "pagume" in message
