from __future__ import annotations

import time
from typing import Any, Callable
from uuid import uuid4

from langgraph.types import interrupt

from pagume_agents.booking.tools import build_booking_tools
from pagume_agents.clients.protocol import PagumeInventoryClient
from pagume_agents.observability import make_event, make_progress
from pagume_agents.permissions import AuthorizationDenied, Permission, require_permission
from pagume_agents.state import TripState


def make_booking_node(client: PagumeInventoryClient) -> Callable:
    def booking_node(state: TripState) -> dict[str, Any]:
        started = time.perf_counter()
        option = state.get("selected_option")
        if not option:
            return {
                "errors": [
                    {"agent": "booking", "message": "No selected option to book"}
                ],
                "agent_results": {"booking": {"status": "error", "results": []}},
            }

        items = [
            {
                "service_type": item["kind"],
                "entity_id": item["entity_id"],
                "name": item["name"],
                "price_etb": item["cost_etb"],
                "currency": "ETB",
            }
            for item in option.get("items", [])
        ]
        prepare_key = f"prepare:{option.get('option_id')}"
        tools = build_booking_tools(client, authorization={"approved": False})
        prepare = next(t for t in tools if t.name == "prepare_booking")
        prepared = prepare.invoke(
            {
                "items": items,
                "idempotency_key": prepare_key,
                "user_id": (state.get("trip_context") or {}).get("user_id"),
            }
        )

        approval_payload = {
            "action": "confirm_booking",
            "booking_id": prepared["id"],
            "total_etb": prepared["price_etb"],
            "currency": "ETB",
            "items": items,
        }
        resume = interrupt(approval_payload)
        approved = bool(resume.get("approved")) if isinstance(resume, dict) else False
        authorization = {
            **(state.get("authorization") or {}),
            "approved": approved,
            "approved_action_ids": [prepared["id"]] if approved else [],
            "spending_cap_etb": (resume or {}).get("spending_cap_etb")
            if isinstance(resume, dict)
            else None,
        }

        if not approved:
            return {
                "pending_approval": approval_payload,
                "authorization": authorization,
                "agent_results": {"booking": {"status": "pending", "results": [prepared]}},
                "errors": [
                    {
                        "agent": "booking",
                        "message": "Booking not authorized; waiting for user approval.",
                    }
                ],
                "events": [
                    make_event(
                        agent="booking",
                        task="confirm",
                        input=approval_payload,
                        error="authorization_required",
                        duration_ms=(time.perf_counter() - started) * 1000,
                    )
                ],
            }

        try:
            require_permission(
                Permission.TRANSACTIONAL,
                authorization,
                action="confirm_booking",
                action_id=prepared["id"],
                amount_etb=prepared["price_etb"],
            )
        except AuthorizationDenied as exc:
            return {
                "pending_approval": approval_payload,
                "authorization": authorization,
                "errors": [{"agent": "booking", "message": str(exc)}],
            }

        authorized_tools = build_booking_tools(client, authorization=authorization)
        confirm = next(t for t in authorized_tools if t.name == "confirm_booking")
        confirmed = confirm.invoke(
            {
                "booking_id": prepared["id"],
                "idempotency_key": f"confirm:{prepared['id']}",
            }
        )
        trip = state.get("trip") or {}
        trip = {
            **trip,
            "id": trip.get("id") or f"PT-{uuid4().hex[:5].upper()}",
            "status": "CONFIRMED",
            "booking_ids": [confirmed["id"]],
            "total_etb": confirmed["price_etb"],
        }
        return {
            "pending_approval": None,
            "authorization": authorization,
            "trip": trip,
            "agent_results": {"booking": {"status": "success", "results": [confirmed]}},
            "progress": [make_progress("Bookings confirmed")],
            "final_message": (
                f"Bookings confirmed. Confirmation {confirmed.get('confirmation_code')}. "
                f"Trip ID: {trip['id']}."
            ),
            "events": [
                make_event(
                    agent="booking",
                    task="confirm",
                    input={"booking_id": prepared["id"]},
                    tool_name="confirm_booking",
                    result_summary={
                        "status": confirmed.get("status"),
                        "confirmation_code": confirmed.get("confirmation_code"),
                    },
                    duration_ms=(time.perf_counter() - started) * 1000,
                )
            ],
        }

    return booking_node
