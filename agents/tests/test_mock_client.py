from pagume_agents.clients.http import HttpInventoryClient
from pagume_agents.clients.mock import MockInventoryClient


def test_search_gorgora(mock_client: MockInventoryClient):
    found = mock_client.search_destinations("Gorgora")
    assert len(found) == 1
    assert found[0].id == "dest_gorgora"


def test_unknown_destination_is_empty(mock_client: MockInventoryClient):
    assert mock_client.search_destinations("Hotel ABC") == []


def test_http_client_requires_base_url():
    client = HttpInventoryClient(base_url="")
    try:
        client.search_destinations("Gorgora")
        raise AssertionError("expected NotImplementedError")
    except NotImplementedError:
        pass
