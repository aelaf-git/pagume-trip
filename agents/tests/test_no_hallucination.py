from pagume_agents.graph import build_graph
from tests.conftest import invoke_message

INVENTED_NAME = "Hotel ABC"


def test_empty_inventory_does_not_invent_hotels(empty_client):
    graph = build_graph(client=empty_client, use_llm=False)
    values, _ = invoke_message(
        graph,
        f"Find me {INVENTED_NAME} near the churches under 5,000 ETB per night.",
        "empty-1",
    )
    message = values.get("final_message") or ""
    results = values.get("agent_results") or {}
    dest_rows = (results.get("destination") or {}).get("results") or []
    hotel_rows = (results.get("accommodation") or {}).get("results") or []
    assert dest_rows == []
    assert hotel_rows == []
    assert "couldn't find" in message.lower() or "unavailable" in message.lower()
    for payload in results.values():
        for row in (payload.get("results") or []):
            assert row.get("name") != INVENTED_NAME
    assert INVENTED_NAME not in message
