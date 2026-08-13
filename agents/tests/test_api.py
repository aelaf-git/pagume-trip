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
