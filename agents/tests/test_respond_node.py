from __future__ import annotations

from unittest.mock import MagicMock

from langchain_core.messages import HumanMessage, SystemMessage

from pagume_agents.respond.node import make_respond_node
from pagume_agents.respond.prompt import CHITCHAT_SYSTEM, RESPOND_SYSTEM

DEST_ROW = {"id": "d1", "name": "Lalibela"}

BASE_STATE = {
    "trip_context": {
        "destination_id": "d1",
        "destination_name": "Lalibela",
        "destination_query": "Lalibela",
        "guests": 2,
        "budget_etb": 10000,
    },
    "agent_results": {
        "destination": {"results": [DEST_ROW]},
        "accommodation": {"results": [{"name": "Seven Olives Hotel"}]},
        "transport": {"results": [{"name": "Lalibela Airport Transfer"}]},
    },
    "selected_option": None,
    "itinerary": [],
    "errors": [],
}


def test_respond_llm_path_called_when_dest_set():
    """LLM is invoked when a destination is confirmed."""
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(content="Welcome to Lalibela!")

    node = make_respond_node(llm=mock_llm)
    result = node(BASE_STATE)

    mock_llm.invoke.assert_called_once()
    args = mock_llm.invoke.call_args[0][0]
    assert isinstance(args[0], SystemMessage)
    assert isinstance(args[1], HumanMessage)
    assert "conversation:" in args[1].content
    assert result["final_message"] == "Welcome to Lalibela!"


def test_respond_fast_path_catalog():
    """Catalog browse skips the LLM entirely and returns a list."""
    mock_llm = MagicMock()
    state = {
        "trip_context": {"browse_destinations": True},
        "agent_results": {
            "destination": {
                "results": [
                    {"name": "Lalibela", "description": "Rock-hewn churches."},
                    {"name": "Gondar", "description": "Castle city."},
                ]
            }
        },
        "selected_option": None,
        "itinerary": [],
        "errors": [],
    }
    node = make_respond_node(llm=mock_llm)
    result = node(state)

    mock_llm.invoke.assert_not_called()
    assert "Lalibela" in result["final_message"]
    assert "Gondar" in result["final_message"]


def test_respond_empty_dest_trip_intent_is_unavailable():
    """Empty destination results return UNAVAILABLE when the user asked for a trip."""
    mock_llm = MagicMock()
    state = {
        "user_message": "Find me a hotel near the churches under 5,000 ETB",
        "trip_context": {},
        "agent_results": {},
        "selected_option": None,
        "itinerary": [],
        "errors": [],
    }
    node = make_respond_node(llm=mock_llm)
    result = node(state)

    mock_llm.invoke.assert_not_called()
    assert "couldn't find" in result["final_message"].lower()


def test_respond_greeting_uses_llm_not_unavailable():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(
        content="Hi Aelaf — I'm Pagume, your Ethiopian travel guide."
    )
    state = {
        "user_message": "Hey I am Aelaf who are you?",
        "trip_context": {},
        "agent_results": {},
        "selected_option": None,
        "itinerary": [],
        "errors": [],
    }
    node = make_respond_node(llm=mock_llm)
    result = node(state)
    mock_llm.invoke.assert_called_once()
    args = mock_llm.invoke.call_args[0][0]
    assert "Hey I am Aelaf who are you?" in args[1].content
    assert "couldn't find" not in result["final_message"].lower()
    assert "Aelaf" in result["final_message"] or "Pagume" in result["final_message"]


def test_chitchat_payload_has_no_trip_framing():
    """Small talk must not see inventory or an intake checklist."""
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(content="Your name is Aelaf.")
    state = {
        "user_message": "What is my name?",
        "messages": [HumanMessage(content="Hey my name is Aelaf.")],
        "trip_context": {},
        "agent_results": {},
        "selected_option": None,
        "itinerary": [],
        "errors": [],
    }
    node = make_respond_node(llm=mock_llm)
    node(state)

    payload = mock_llm.invoke.call_args[0][0][1].content
    assert "latest_user_message: What is my name?" in payload
    assert "conversation:" in payload
    assert "Aelaf" in payload
    for banned in ("inventory_summary", "missing_fields", "trip_option", "destination:"):
        assert banned not in payload


def test_chitchat_uses_chat_system_prompt():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(content="Hi there.")
    state = {
        "user_message": "How is your day going?",
        "trip_context": {},
        "agent_results": {},
        "selected_option": None,
        "itinerary": [],
        "errors": [],
    }
    node = make_respond_node(llm=mock_llm)
    node(state)

    system = mock_llm.invoke.call_args[0][0][0].content
    assert system == CHITCHAT_SYSTEM
    assert system != RESPOND_SYSTEM


def test_planning_turn_keeps_full_payload():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(content="Lalibela awaits.")
    node = make_respond_node(llm=mock_llm)
    node(BASE_STATE)

    system = mock_llm.invoke.call_args[0][0][0].content
    payload = mock_llm.invoke.call_args[0][0][1].content
    assert system == RESPOND_SYSTEM
    assert "inventory_summary:" in payload
    assert "Seven Olives Hotel" in payload
    assert "missing_fields:" in payload


def test_respond_fallback_on_llm_error():
    """If LLM raises, the template fallback is used instead."""
    mock_llm = MagicMock()
    mock_llm.invoke.side_effect = RuntimeError("quota exceeded")

    node = make_respond_node(llm=mock_llm)
    result = node(BASE_STATE)

    # Should not raise; fallback produces a non-empty string
    assert result["final_message"]
    assert "Lalibela" in result["final_message"] or "Pagume" in result["final_message"]


def test_respond_no_llm_uses_template():
    """Without LLM, template fallback is used directly."""
    node = make_respond_node(llm=None)
    result = node(BASE_STATE)

    assert "Lalibela" in result["final_message"]
    assert result["messages"]


def test_respond_catalog_followup_uses_llm():
    """Later catalog turns use the LLM so the session can stay conversational."""
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(content="Lalibela is the one with the churches — want me to plan it?")
    state = {
        "trip_context": {"browse_destinations": True},
        "agent_results": {
            "destination": {
                "results": [
                    {"name": "Lalibela", "description": "Rock-hewn churches."},
                    {"name": "Gondar", "description": "Castle city."},
                ]
            }
        },
        "messages": [
            HumanMessage(content="Recommend places in Ethiopia"),
            HumanMessage(content="Which is best for history?"),
        ],
        "selected_option": None,
        "itinerary": [],
        "errors": [],
    }
    node = make_respond_node(llm=mock_llm)
    result = node(state)
    mock_llm.invoke.assert_called_once()
    payload = mock_llm.invoke.call_args[0][0][1].content
    assert "missing_fields: none" in payload
    assert "churches" in result["final_message"]


def test_circuit_catalog_payload_omits_known_missing_fields():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = MagicMock(
        content="Start in Addis, then north to Lalibela. Want me to lock Addis first?"
    )
    state = {
        "user_message": "Okay from June 20 - August 20",
        "trip_context": {
            "browse_destinations": True,
            "wants_circuit": True,
            "guests": 1,
            "check_in": "2026-06-20",
            "check_out": "2026-08-20",
            "duration_days": 61,
            "budget_etb": 1_000_000,
        },
        "agent_results": {
            "destination": {
                "results": [
                    {"name": "Addis Ababa", "description": "Capital city."},
                    {"name": "Lalibela", "description": "Rock-hewn churches."},
                ]
            }
        },
        "messages": [
            HumanMessage(content="I want to visit all of them. one by one."),
            HumanMessage(content="I am traveling alone"),
        ],
        "selected_option": None,
        "itinerary": [],
        "errors": [],
    }
    node = make_respond_node(llm=mock_llm)
    result = node(state)

    system = mock_llm.invoke.call_args[0][0][0].content
    payload = mock_llm.invoke.call_args[0][0][1].content
    assert system == RESPOND_SYSTEM
    assert "wants_circuit: True" in payload
    assert "guests: 1" in payload
    assert "check_in: 2026-06-20" in payload
    assert "missing_fields: none" in payload
    assert "number of guests" not in payload
    assert "travel dates" not in payload
    assert "Addis Ababa" in payload
    assert result["progress"][0]["label"] == "Sketching your Ethiopia circuit"

