from pagume_agents.models.agent import SupervisorDecision
from pagume_agents.models.trip import TripContext
from pagume_agents.supervisor.node import _supervisor_user_payload
from pagume_agents.supervisor.prompt import SUPERVISOR_SYSTEM


def test_prompt_contains_anti_loop_policy():
    lowered = SUPERVISOR_SYSTEM.lower()
    assert "already" in lowered
    assert "destination_id" in lowered
    assert "respond" in lowered
    assert "never override proposed respond" in lowered


def test_supervisor_user_payload_includes_browse_and_names():
    context = TripContext(
        browse_destinations=True,
        destination_id=None,
        wants_hotel=False,
        wants_transport=False,
    )
    proposed = SupervisorDecision(next_agent="respond", task="present")
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
        proposed,
    )
    assert "browse_destinations: True" in payload
    assert "Gorgora" in payload
    assert "Lalibela" in payload
    assert '"next_agent":"respond"' in payload or '"next_agent": "respond"' in payload
    assert "Hotel ABC" not in payload
    assert "Dubai" not in payload
    assert "Agent results keys" not in payload
