from pagume_agents.models.agent import SupervisorDecision
from pagume_agents.models.trip import TripContext
from pagume_agents.supervisor.node import _supervisor_user_payload
from pagume_agents.supervisor.prompt import SUPERVISOR_SYSTEM


def test_prompt_says_supervisor_chooses_order():
    lowered = SUPERVISOR_SYSTEM.lower()
    assert "no required sequence" in lowered or "there is no required sequence" in lowered
    assert "prefer the proposed pipeline" not in lowered
    assert "destination_id" in lowered
    assert "respond" in lowered
    assert "greeting" in lowered or "ordinary chat" in lowered
    assert "already" in lowered


def test_supervisor_user_payload_includes_browse_and_names():
    context = TripContext(
        browse_destinations=True,
        destination_id=None,
        wants_hotel=False,
        wants_transport=False,
    )
    payload = _supervisor_user_payload(
        "I want to visit Ethiopia. Recommend places.",
        context,
        {
            "destination": {
                "status": "success",
                "results": [
                    {"id": "dest_gorgora", "name": "Gorgora"},
                    {"id": "dest_lalibela", "name": "Lalibela"},
                ],
            }
        },
    )
    assert "Conversation so far:" in payload
    assert "Latest user message:" in payload
    assert "browse_destinations: True" in payload
    assert "Gorgora" in payload
    assert "Lalibela" in payload
    assert "Proposed pipeline" not in payload
    assert "Hotel ABC" not in payload
    assert "Dubai" not in payload
    assert "Agent results keys" not in payload
