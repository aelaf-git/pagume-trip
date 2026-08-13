from langchain_core.tools import StructuredTool

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.permissions import Permission
from pagume_agents.shared.serialize import dump_models, dump_optional


def build_destination_tools(client: PagumeInventoryClient) -> list[StructuredTool]:
    def search_destinations(query: str, region: str | None = None) -> list[dict]:
        """Search verified Pagume destinations. Returns database records only."""
        return dump_models(client.search_destinations(query=query, region=region))

    def get_destination(destination_id: str) -> dict | None:
        """Get a verified destination by id."""
        return dump_optional(client.get_destination(destination_id))

    def find_nearby_destinations(
        destination_id: str, radius_km: float = 100
    ) -> list[dict]:
        """Find nearby verified destinations from Pagume inventory."""
        return dump_models(
            client.find_nearby_destinations(destination_id, radius_km=radius_km)
        )

    tools = [
        StructuredTool.from_function(
            search_destinations,
            name="search_destinations",
            description="Search verified destinations in the Pagume database.",
        ),
        StructuredTool.from_function(
            get_destination,
            name="get_destination",
            description="Get one destination by Pagume destination_id.",
        ),
        StructuredTool.from_function(
            find_nearby_destinations,
            name="find_nearby_destinations",
            description="Find nearby verified destinations by destination_id.",
        ),
    ]
    for tool in tools:
        tool.metadata = {"permission": Permission.READ}
    return tools
