# Pagume Agents

LangGraph multi-agent travel planner for Pagume Trip.

Agents reason. Tools execute. Inventory comes only from the Pagume client (mock now, HTTP later). Users authorize money.

## Architecture

One LangGraph process. Each specialist is a package with its own node, tools, and prompt:

```
pagume_agents/
  supervisor/      destination/    accommodation/
  transport/       car_rental/     tour/
  budget/          itinerary/      booking/      respond/
  graph.py         state.py        shared/       clients/
```

The Supervisor routes structured tasks. Budget is a calculator, not an LLM. Booking interrupts before `TRANSACTIONAL` tools. Specialists never query PostgreSQL; they call `PagumeInventoryClient`.

## Setup

```bash
cd agents
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
```

The default model provider is **Groq**. Copy `.env.example` to `.env` and set `GROQ_API_KEY` from [console.groq.com/keys](https://console.groq.com/keys).

```
LLM_BASE_URL=https://api.groq.com/openai/v1
GROQ_API_KEY=gsk_...
LLM_MODEL=openai/gpt-oss-20b
USE_LLM=true
```

For local tests without Groq, set `USE_LLM=false`.

## Run

```bash
pagume-agents
# or
uvicorn pagume_agents.api.app:app --reload --app-dir src --port 8100
```

## API

- `POST /v1/runs` — start a conversation (`thread_id`, `message`)
- `POST /v1/runs/{thread_id}/messages` — continue
- `POST /v1/runs/{thread_id}/approve` — resume after booking interrupt
- `GET /v1/runs/{thread_id}/events` — SSE progress stream
- `GET /health` — liveness

## Tests

```bash
pytest
```

## Swapping inventory

`MockInventoryClient` seeds Gorgora and Lalibela from `data/mock/`. Point `INVENTORY_CLIENT=http` and `PAGUME_API_BASE_URL` at the Pagume API when it exists. `HttpInventoryClient` implements the same protocol.
