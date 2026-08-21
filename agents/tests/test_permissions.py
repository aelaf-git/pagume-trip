import pytest

from pagume_agents.clients.mock import MockInventoryClient
from pagume_agents.permissions import AuthorizationDenied
from pagume_agents.tools.booking import build_booking_tools


def test_confirm_booking_without_approval_does_not_call_client(
    mock_client: MockInventoryClient,
):
    prepared = mock_client.prepare_booking(
        [
            {
                "service_type": "hotel",
                "entity_id": "hotel_gorgora_resort_a",
                "name": "Gorgora Lakeside Resort",
                    "price_etb": 18000,
                    "room_id": "room_resort_a_family",
                    "check_in": "2026-09-10",
                    "check_out": "2026-09-14",
            }
        ],
        idempotency_key="prep-1",
    )
    tools = build_booking_tools(mock_client, authorization={})
    confirm = next(tool for tool in tools if tool.name == "confirm_booking")
    with pytest.raises(AuthorizationDenied):
        confirm.invoke(
            {"booking_id": prepared.id, "idempotency_key": "confirm-1"}
        )
    assert mock_client.confirm_calls == 0
    assert mock_client.bookings[prepared.id].status.value == "PENDING"


def test_confirm_booking_with_approval(mock_client: MockInventoryClient):
    prepared = mock_client.prepare_booking(
        [
            {
                "service_type": "hotel",
                "entity_id": "hotel_gorgora_resort_a",
                "name": "Gorgora Lakeside Resort",
                    "price_etb": 18000,
                    "room_id": "room_resort_a_family",
                    "check_in": "2026-09-10",
                    "check_out": "2026-09-14",
            }
        ],
        idempotency_key="prep-2",
    )
    tools = build_booking_tools(mock_client, authorization={"approved": True})
    confirm = next(tool for tool in tools if tool.name == "confirm_booking")
    result = confirm.invoke(
        {"booking_id": prepared.id, "idempotency_key": "confirm-2"}
    )
    assert result["status"] == "CONFIRMED"
    assert mock_client.confirm_calls == 1
