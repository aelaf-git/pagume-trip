from __future__ import annotations

import json
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from pydantic import BaseModel, Field

from pagume_agents.clients import get_inventory_client
from pagume_agents.config import get_settings
from pagume_agents.graph import compile_app
from pagume_agents.observability import RunEventLog


class RunRequest(BaseModel):
    thread_id: str
    message: str
    user_id: str | None = None


class MessageRequest(BaseModel):
    message: str


class ApproveRequest(BaseModel):
    approved: bool = True
    spending_cap_etb: float | None = None


class AgentRunResponse(BaseModel):
    thread_id: str
    message: str | None = None
    progress: list[dict[str, Any]] = Field(default_factory=list)
    options: list[dict[str, Any]] = Field(default_factory=list)
    selected_option: dict[str, Any] | None = None
    pending_approval: dict[str, Any] | None = None
    trip: dict[str, Any] | None = None
    interrupted: bool = False
    errors: list[dict[str, Any]] = Field(default_factory=list)


event_log = RunEventLog()


def _interrupt_payload(snapshot) -> dict[str, Any] | None:
    tasks = getattr(snapshot, "tasks", None) or ()
    for task in tasks:
        for item in getattr(task, "interrupts", None) or []:
            value = getattr(item, "value", item)
            if isinstance(value, dict):
                return value
    interrupts = getattr(snapshot, "interrupts", None) or ()
    for item in interrupts:
        value = getattr(item, "value", item)
        if isinstance(value, dict):
            return value
    return None


def _state_to_response(graph, config: dict, thread_id: str) -> AgentRunResponse:
    snapshot = graph.get_state(config)
    values = snapshot.values if snapshot else {}
    pending = values.get("pending_approval") or _interrupt_payload(snapshot)
    events = values.get("events") or []
    event_log.extend(thread_id, events)
    return AgentRunResponse(
        thread_id=thread_id,
        message=values.get("final_message"),
        progress=values.get("progress") or [],
        options=values.get("proposed_options") or [],
        selected_option=values.get("selected_option"),
        pending_approval=pending,
        trip=values.get("trip"),
        interrupted=pending is not None,
        errors=values.get("errors") or [],
    )


def _initial_state(message: str, user_id: str | None = None) -> dict[str, Any]:
    return {
        "messages": [HumanMessage(content=message)],
        "user_message": message,
        "trip_context": {"user_id": user_id} if user_id else {},
        "agent_results": {},
        "authorization": {},
        "progress": [],
        "errors": [],
        "events": [],
    }


def create_app(graph=None) -> FastAPI:
    settings = get_settings()
    compiled = graph or compile_app(settings, client=get_inventory_client(settings))

    app = FastAPI(title="Pagume Agents", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.graph = compiled

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/v1/runs", response_model=AgentRunResponse)
    def start_run(body: RunRequest) -> AgentRunResponse:
        config = {"configurable": {"thread_id": body.thread_id}, "recursion_limit": 40}
        app.state.graph.invoke(_initial_state(body.message, body.user_id), config)
        return _state_to_response(app.state.graph, config, body.thread_id)

    @app.post("/v1/runs/{thread_id}/messages", response_model=AgentRunResponse)
    def continue_run(thread_id: str, body: MessageRequest) -> AgentRunResponse:
        config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 40}
        snapshot = app.state.graph.get_state(config)
        if not snapshot or not snapshot.values:
            raise HTTPException(status_code=404, detail="Unknown thread_id")
        app.state.graph.invoke(
            {
                "messages": [HumanMessage(content=body.message)],
                "user_message": body.message,
            },
            config,
        )
        return _state_to_response(app.state.graph, config, thread_id)

    @app.post("/v1/runs/{thread_id}/approve", response_model=AgentRunResponse)
    def approve_run(thread_id: str, body: ApproveRequest) -> AgentRunResponse:
        config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 40}
        snapshot = app.state.graph.get_state(config)
        if not snapshot or not snapshot.values:
            raise HTTPException(status_code=404, detail="Unknown thread_id")
        app.state.graph.invoke(
            Command(
                resume={
                    "approved": body.approved,
                    "spending_cap_etb": body.spending_cap_etb,
                }
            ),
            config,
        )
        return _state_to_response(app.state.graph, config, thread_id)

    @app.get("/v1/runs/{thread_id}/events")
    def stream_events(thread_id: str) -> StreamingResponse:
        config = {"configurable": {"thread_id": thread_id}}
        snapshot = app.state.graph.get_state(config)
        values = snapshot.values if snapshot else {}
        payload_events = event_log.list(thread_id) or values.get("events") or []
        progress = values.get("progress") or []

        def generate():
            for event in payload_events:
                yield f"event: agent\ndata: {json.dumps(event)}\n\n"
            for item in progress:
                yield f"event: progress\ndata: {json.dumps(item)}\n\n"
            yield "event: done\ndata: {}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    return app


app = create_app()


def main() -> None:
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "pagume_agents.api.app:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )
