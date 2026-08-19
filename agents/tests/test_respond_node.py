from __future__ import annotations

from unittest.mock import MagicMock

from langchain_core.messages import HumanMessage, SystemMessage

from pagume_agents.respond.node import make_respond_node

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
    assert "churches" in result["final_message"]

