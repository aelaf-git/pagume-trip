from pagume_agents.clients.http import HttpInventoryClient
from pagume_agents.clients.mock import MockInventoryClient
from pagume_agents.clients.preferences import InMemoryPreferenceStore, UserPreferenceStore
from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.config import Settings, get_settings


def get_inventory_client(settings: Settings | None = None) -> PagumeInventoryClient:
    """Runtime inventory always comes from the Pagume API (database-backed)."""
    settings = settings or get_settings()
    base_url = (settings.pagume_api_base_url or "").strip()
    if not base_url:
        raise RuntimeError(
            "PAGUME_API_BASE_URL is required. Agents load inventory via the API, "
            "not local mock files. Example: http://127.0.0.1:8000"
        )
    return HttpInventoryClient(base_url=base_url)


__all__ = [
    "HttpInventoryClient",
    "InMemoryPreferenceStore",
    "MockInventoryClient",
    "PagumeInventoryClient",
    "UserPreferenceStore",
    "get_inventory_client",
]
