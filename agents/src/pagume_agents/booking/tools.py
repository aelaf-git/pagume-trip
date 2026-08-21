from langchain_core.tools import StructuredTool

from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.permissions import Permission, require_permission


def build_booking_tools(
    client: PagumeInventoryClient,
    authorization: dict | None = None,
) -> list[StructuredTool]:
    def prepare_booking(
        items: list[dict],
        idempotency_key: str,
        user_id: str | None = None,
    ) -> dict:
        """Hold a draft booking. Does not charge the traveler."""
        booking = client.prepare_booking(
            items, user_id=user_id, idempotency_key=idempotency_key
        )
        return booking.model_dump(mode="json")

    def confirm_booking(booking_id: str, idempotency_key: str) -> dict:
        """Confirm a prepared booking. Requires explicit user authorization."""
        require_permission(
            Permission.TRANSACTIONAL,
            authorization,
            action="confirm_booking",
            action_id=booking_id,
        )
        booking = client.confirm_booking(booking_id, idempotency_key=idempotency_key)
        return booking.model_dump(mode="json")

    def cancel_booking(booking_id: str, idempotency_key: str) -> dict:
        """Cancel a booking. Requires explicit user authorization."""
        require_permission(
            Permission.TRANSACTIONAL,
            authorization,
            action="cancel_booking",
            action_id=booking_id,
        )
        booking = client.cancel_booking(booking_id, idempotency_key=idempotency_key)
        return booking.model_dump(mode="json")

    prepare = StructuredTool.from_function(
        prepare_booking,
        name="prepare_booking",
        description="Prepare/hold a booking without charging.",
    )
    prepare.metadata = {"permission": Permission.PREPARE}

    confirm = StructuredTool.from_function(
        confirm_booking,
        name="confirm_booking",
        description="Confirm a prepared booking after user approval.",
    )
    confirm.metadata = {"permission": Permission.TRANSACTIONAL}

    cancel = StructuredTool.from_function(
        cancel_booking,
        name="cancel_booking",
        description="Cancel a booking after user approval.",
    )
    cancel.metadata = {"permission": Permission.TRANSACTIONAL}
    return [prepare, confirm, cancel]
