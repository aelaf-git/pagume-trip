import pytest
from langchain_core.messages import HumanMessage

from pagume_agents.clients.mock import MockInventoryClient
from pagume_agents.graph import build_graph
from tests.scenario import GORGORA_MESSAGE

__all__ = ["GORGORA_MESSAGE"]


@pytest.fixture
def mock_client() -> MockInventoryClient:
    return MockInventoryClient()


@pytest.fixture
def empty_client() -> MockInventoryClient:
    return MockInventoryClient(empty=True)


@pytest.fixture
def graph(mock_client):
    return build_graph(client=mock_client, use_llm=False)


def invoke_message(graph, message: str, thread_id: str, client=None):
    config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 40}
    graph.invoke(
        {
            "messages": [HumanMessage(content=message)],
            "user_message": message,
            "agent_results": {},
            "authorization": {},
            "progress": [],
            "errors": [],
            "events": [],
        },
        config,
    )
    return graph.get_state(config).values, config
