from langchain_core.tools import StructuredTool

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.permissions import Permission
from pagume_agents.shared.serialize import dump_models


def build_car_rental_tools(client: PagumeInventoryClient) -> list[StructuredTool]:
    def search_car_rentals(
        destination_id: str,
        seats: int | None = None,
        is_4wd: bool | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict]:
        """Search verified car rentals. Filter by seats and 4WD."""
        return dump_models(
            client.search_car_rentals(
                destination_id=destination_id,
                seats=seats,
                is_4wd=is_4wd,
                start_date=start_date,
                end_date=end_date,
            )
        )

    tools = [
        StructuredTool.from_function(
            search_car_rentals,
            name="search_car_rentals",
            description="Search verified car rentals for a destination_id.",
        ),
    ]
    for tool in tools:
        tool.metadata = {"permission": Permission.READ}
    return tools
