from pagume_agents.models.agent import SupervisorDecision
from pagume_agents.supervisor.node import (
    _apply_supervisor_guardrails,
    fallback_decision,
    pipeline_decision,
)


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


def test_pipeline_greeting_goes_to_respond():
    decision = pipeline_decision(
        {
            "trip_context": {},
            "agent_results": {},
            "user_message": "Hey I am Aelaf who are you?",
        }
    )
    assert decision.next_agent == "respond"


def test_fallback_hotel_only_skips_transport():
    dest_locked = {
        "trip_context": {
            "destination_id": "dest_lalibela",
            "destination_name": "Lalibela",
            "destination_query": "Lalibela",
            "wants_hotel": True,
            "wants_transport": False,
        },
        "agent_results": {
            "destination": {"status": "success", "results": [{"id": "dest_lalibela"}]},
        },
        "user_message": "Find me a hotel in Lalibela",
    }
    first = fallback_decision(dest_locked)
    assert first.next_agent == "accommodation"

    dest_locked["agent_results"]["accommodation"] = {
        "status": "success",
        "results": [{"name": "Lalibela Guest House"}],
    }
    after_hotels = fallback_decision(dest_locked)
    assert after_hotels.next_agent == "respond"


def test_guardrails_keep_llm_respond_instead_of_forcing_hotel():
    state = {
        "trip_context": {
            "destination_id": "dest_lalibela",
            "destination_name": "Lalibela",
            "wants_hotel": True,
            "wants_transport": False,
        },
        "agent_results": {
            "destination": {"status": "success", "results": [{"id": "dest_lalibela"}]},
        },
        "user_message": "Find me a hotel in Lalibela",
    }
    llm_choice = SupervisorDecision(next_agent="respond", task="present")
    clamped = _apply_supervisor_guardrails(llm_choice, state)
    assert clamped.next_agent == "respond"
