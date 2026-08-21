from langchain_core.tools import StructuredTool

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.permissions import Permission
from pagume_agents.shared.serialize import dump_models, dump_optional


def build_accommodation_tools(client: PagumeInventoryClient) -> list[StructuredTool]:
    def search_hotels(
        destination_id: str,
        guests: int | None = None,
        max_price_etb: float | None = None,
        check_in: str | None = None,
        check_out: str | None = None,
    ) -> list[dict]:
        """Search verified hotels/resorts/lodges. Never invent properties."""
        return dump_models(
            client.search_hotels(
                destination_id=destination_id,
                guests=guests,
                max_price_etb=max_price_etb,
                check_in=check_in,
                check_out=check_out,
            )
        )

    def get_hotel_details(hotel_id: str) -> dict | None:
        """Get hotel details by id."""
        return dump_optional(client.get_hotel_details(hotel_id))

    def search_rooms(
        hotel_id: str,
        guests: int | None = None,
        max_price_etb: float | None = None,
    ) -> list[dict]:
        """Search rooms for a verified hotel."""
        return dump_models(
            client.search_rooms(
                hotel_id=hotel_id, guests=guests, max_price_etb=max_price_etb
            )
        )

    def check_hotel_availability(
        hotel_id: str, room_id: str, check_in: str, check_out: str
    ) -> dict:
        """Check room availability for dates."""
        available = client.check_hotel_availability(
            hotel_id, room_id, check_in, check_out
        )
        return {"hotel_id": hotel_id, "room_id": room_id, "available": available}

    tools = [
        StructuredTool.from_function(
            search_hotels,
            name="search_hotels",
            description="Search verified hotels for a destination_id.",
        ),
        StructuredTool.from_function(
            get_hotel_details,
            name="get_hotel_details",
            description="Get one hotel by hotel_id.",
        ),
        StructuredTool.from_function(
            search_rooms,
            name="search_rooms",
            description="Search rooms for a hotel_id.",
        ),
        StructuredTool.from_function(
            check_hotel_availability,
            name="check_hotel_availability",
            description="Check if a room is available between check_in and check_out.",
        ),
    ]
    for tool in tools:
        tool.metadata = {"permission": Permission.READ}
    return tools
