from langchain_core.tools import StructuredTool

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.permissions import Permission
from pagume_agents.shared.serialize import dump_models, dump_optional


def build_tour_tools(client: PagumeInventoryClient) -> list[StructuredTool]:
    def search_tour_packages(
        destination_id: str,
        query: str | None = None,
        guests: int | None = None,
        check_in: str | None = None,
        check_out: str | None = None,
    ) -> list[dict]:
        """Search verified tour packages including boat trips."""
        return dump_models(
            client.search_tour_packages(
                destination_id=destination_id,
                query=query,
                guests=guests,
                check_in=check_in,
                check_out=check_out,
            )
        )

    def get_package_details(package_id: str) -> dict | None:
        """Get a tour package by id."""
        return dump_optional(client.get_package_details(package_id))

    def check_tour_availability(package_id: str, date: str, guests: int) -> dict:
        """Check remaining seats for a tour package on a date."""
        available = client.check_tour_availability(package_id, date, guests)
        return {"package_id": package_id, "available": available}

    tools = [
        StructuredTool.from_function(
            search_tour_packages,
            name="search_tour_packages",
            description="Search verified tour packages for a destination_id.",
        ),
        StructuredTool.from_function(
            get_package_details,
            name="get_package_details",
            description="Get one tour package by package_id.",
        ),
        StructuredTool.from_function(
            check_tour_availability,
            name="check_tour_availability",
            description="Check tour package availability for a date and guest count.",
        ),
    ]
    for tool in tools:
        tool.metadata = {"permission": Permission.READ}
    return tools
