from langgraph.types import Command

from pagume_agents.clients.errors import RoomUnavailableError
from pagume_agents.clients.mock import MockInventoryClient
from pagume_agents.graph import build_graph
from pagume_agents.models.booking import BookingStatus
from tests.conftest import GORGORA_MESSAGE, invoke_message


def test_confirm_is_idempotent(mock_client: MockInventoryClient):
    prepared = mock_client.prepare_booking(
        [
            {
                "service_type": "tour",
                "entity_id": "tour_gorgora_boat_a",
                "name": "Lake Tana Boat Trip A",
                "price_etb": 6000,
            }
        ],
        idempotency_key="prep-idem",
    )
    first = mock_client.confirm_booking(prepared.id, idempotency_key="same-key")
    second = mock_client.confirm_booking(prepared.id, idempotency_key="same-key")
    confirmed = [
        booking
        for booking in mock_client.bookings.values()
        if booking.status == BookingStatus.CONFIRMED
    ]
    assert first.id == second.id
    assert first.confirmation_code == second.confirmation_code
    assert len(confirmed) == 1


def test_booking_interrupt_requires_approval(mock_client: MockInventoryClient):
    graph = build_graph(client=mock_client, use_llm=False)
    _, config = invoke_message(graph, GORGORA_MESSAGE, "book-thread")
    graph.invoke(
        {"user_message": "Book Trip"},
        config,
    )
    snapshot = graph.get_state(config)
    interrupted = any(getattr(task, "interrupts", None) for task in snapshot.tasks)
    assert interrupted
    assert mock_client.confirm_calls == 0

    graph.invoke(Command(resume={"approved": True}), config)
    snapshot = graph.get_state(config)
    booking = (snapshot.values.get("agent_results") or {}).get("booking") or {}
    assert booking.get("status") == "success"
    assert mock_client.confirm_calls == 1


def test_mock_hold_blocks_second_prepare(mock_client: MockInventoryClient):
    item = {
        "service_type": "hotel",
        "entity_id": "hotel_gorgora_resort_a",
        "name": "Gorgora Lakeside Resort",
        "price_etb": 18000,
        "room_id": "room_resort_a_family",
        "check_in": "2026-09-10",
        "check_out": "2026-09-14",
    }
    mock_client.prepare_booking([item], idempotency_key="user-a")
    try:
        mock_client.prepare_booking([item], idempotency_key="user-b")
        raise AssertionError("expected RoomUnavailableError")
    except RoomUnavailableError:
        pass
    hotels = mock_client.search_hotels(
        "dest_gorgora",
        guests=6,
        check_in="2026-09-10",
        check_out="2026-09-14",
    )
    assert all(h.id != "hotel_gorgora_resort_a" for h in hotels)

    first = mock_client.bookings[mock_client._idempotency["user-a"]]
    mock_client.confirm_booking(first.id, idempotency_key="confirm-a")
    still = mock_client.search_hotels(
        "dest_gorgora",
        guests=6,
        check_in="2026-09-10",
        check_out="2026-09-14",
    )
    assert all(h.id != "hotel_gorgora_resort_a" for h in still)
    mock_client.cancel_booking(first.id, idempotency_key="cancel-a")
    restored = mock_client.search_hotels(
        "dest_gorgora",
        guests=6,
        check_in="2026-09-10",
        check_out="2026-09-14",
    )
    assert any(h.id == "hotel_gorgora_resort_a" for h in restored)