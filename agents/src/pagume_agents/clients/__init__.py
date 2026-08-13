from pagume_agents.clients.http import HttpInventoryClient
from pagume_agents.clients.mock import MockInventoryClient
from pagume_agents.clients.preferences import InMemoryPreferenceStore, UserPreferenceStore
from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.config import Settings, get_settings


def get_inventory_client(settings: Settings | None = None) -> PagumeInventoryClient:
    settings = settings or get_settings()
    if settings.inventory_client == "http":
        return HttpInventoryClient(base_url=settings.pagume_api_base_url)
    return MockInventoryClient()


__all__ = [
    "HttpInventoryClient",
    "InMemoryPreferenceStore",
    "MockInventoryClient",
    "PagumeInventoryClient",
    "UserPreferenceStore",
    "get_inventory_client",
]
