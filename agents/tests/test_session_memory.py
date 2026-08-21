from fastapi.testclient import TestClient
from langchain_core.messages import HumanMessage

from pagume_agents.api.app import create_app
from pagume_agents.clients.mock import MockInventoryClient
from pagume_agents.graph import build_graph
from pagume_agents.models.trip import TripContext
from pagume_agents.state import merge_dicts
from pagume_agents.supervisor.node import stale_specialist_keys
from tests.conftest import invoke_message


def test_merge_dicts_drops_none():
    merged = merge_dicts(
        {"destination": {"status": "success"}, "accommodation": {"status": "success"}},
        {"accommodation": None},
    )
    assert "destination" in merged
    assert "accommodation" not in merged


def test_stale_keys_when_user_picks_city_after_browse():
    existing = TripContext(browse_destinations=True)
    context = TripContext(destination_query="Lalibela", browse_destinations=False)
    stale = stale_specialist_keys(
        existing,
        context,
        {"destination": {"status": "success", "results": [{"name": "Gorgora"}]}},
    )
    assert "destination" in stale


def test_followup_city_after_ethiopia_browse(graph):
    values, config = invoke_message(
        graph,
        "I want to visit Ethiopia. Recommend places.",
        "session-browse-then-lalibela",
    )
    assert values["trip_context"]["destination_id"] is None

    graph.invoke(
        {
            "messages": [HumanMessage(content="Lalibela for two people, 3 days")],
            "user_message": "Lalibela for two people, 3 days",
        },
        config,
    )
    values = graph.get_state(config).values
    assert values["trip_context"]["destination_id"] == "dest_lalibela"
    assert values["trip_context"]["guests"] == 2
    assert values["trip_context"]["duration_days"] == 3
    assert values.get("selected_option") is not None
    roles = [getattr(m, "type", None) for m in values.get("messages") or []]
    assert roles.count("human") >= 2
    assert roles.count("ai") >= 2


def test_api_session_continue_and_restore():
    client = MockInventoryClient()
    compiled = build_graph(client=client, use_llm=False)
    http = TestClient(create_app(graph=compiled))
    first = http.post(
        "/v1/runs",
        json={"thread_id": "session-api-1", "message": "I want to visit Ethiopia. Recommend places."},
    )
    assert first.status_code == 200
    assert first.json()["messages"]
    second = http.post(
        "/v1/runs/session-api-1/messages",
        json={"message": "Lalibela for two people"},
    )
    assert second.status_code == 200
    body = second.json()
    assert len(body["messages"]) >= 4
    assert body["messages"][0]["role"] == "user"
    restored = http.get("/v1/runs/session-api-1")
    assert restored.status_code == 200
    assert restored.json()["messages"] == body["messages"]
    assert "Lalibela" in (body["message"] or "")
