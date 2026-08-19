from langchain_core.tools import StructuredTool

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.permissions import Permission
from pagume_agents.shared.serialize import dump_models


def build_transport_tools(client: PagumeInventoryClient) -> list[StructuredTool]:
    def search_transport(
        destination_id: str,
        seats: int | None = None,
        service_type: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict]:
        """Search private cars, minibuses, and other registered transport."""
        return dump_models(
            client.search_transport(
                destination_id=destination_id,
                seats=seats,
                service_type=service_type,
                start_date=start_date,
                end_date=end_date,
            )
        )

    def check_vehicle_availability(
        vehicle_id: str, start_date: str, end_date: str
    ) -> dict:
        """Check vehicle availability for a date range."""
        available = client.check_vehicle_availability(vehicle_id, start_date, end_date)
        return {"vehicle_id": vehicle_id, "available": available}

    tools = [
        StructuredTool.from_function(
            search_transport,
            name="search_transport",
            description="Search verified transportation for a destination_id.",
        ),
        StructuredTool.from_function(
            check_vehicle_availability,
            name="check_vehicle_availability",
            description="Check vehicle availability between start_date and end_date.",
        ),
    ]
    for tool in tools:
        tool.metadata = {"permission": Permission.READ}
    return tools
