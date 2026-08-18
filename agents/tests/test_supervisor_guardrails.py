from pagume_agents.models.agent import SupervisorDecision
from pagume_agents.supervisor.node import _apply_supervisor_guardrails


def test_guardrails_respond_after_catalog_without_destination_id():
    state = {
        "trip_context": {
            "browse_destinations": True,
            "destination_id": None,
            "wants_hotel": False,
            "wants_transport": False,
        },
        "agent_results": {
            "destination": {
                "status": "success",
                "results": [{"id": "dest_gorgora", "name": "Gorgora"}],
            }
        },
        "user_message": "I want to visit Ethiopia. Recommend places.",
    }
    bad = SupervisorDecision(next_agent="destination", task="search")
    clamped = _apply_supervisor_guardrails(bad, state)
    assert clamped.next_agent == "respond"


def test_guardrails_block_repeat_destination():
    state = {
        "trip_context": {"destination_id": "dest_gorgora", "wants_hotel": True},
        "agent_results": {
            "destination": {"status": "success", "results": [{"id": "dest_gorgora"}]},
        },
        "user_message": "Gorgora trip",
    }
    bad = SupervisorDecision(next_agent="destination", task="search")
    clamped = _apply_supervisor_guardrails(bad, state)
    assert clamped.next_agent == "accommodation"
