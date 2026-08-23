# Pagume Trip

## Description

Pagume Trip is an AI-powered tourism application focused on improving the travel experience in Ethiopia. It uses a multi-agent AI system to help users discover destinations, hotels, travel agencies, car rentals, transportation options, and tourism activities. The platform also allows registered tourism providers to manage their services through web portals.

## Problem Statement

Tourists in Ethiopia face several challenges when planning and managing their trips:

- Tourism information is scattered across different platforms.
- It is difficult to find reliable and verified tourism providers.
- Travelers must manually search for hotels, transportation, tours, and activities.
- Comparing different travel options can be time-consuming.
- Finding reliable car rental and transportation services can be difficult.
- Planning a complete itinerary requires combining information from multiple sources.
- Tourism businesses have limited centralized digital platforms to promote their services.
- Traditional tourism applications do not provide intelligent, personalized travel assistance.

## Solution

Pagume Trip addresses these problems by providing:

- **AI-powered multi-agent travel planning** that can understand and manage a user's travel requirements.
- **Verified tourism database** containing registered destinations, hotels, resorts, travel agencies, tour packages, car rentals, transportation providers, and activities.
- **Intelligent recommendations** based on the user's budget, preferences, destination, dates, and group size.
- **Hotel and resort portals** where businesses can register, upload images, manage rooms, prices, and availability.
- **Travel agency portals** where agencies can register, create tour packages, manage services, and receive bookings.
- **Car rental and transportation services** that allow travelers to find and book different transportation options.
- **AI-generated itineraries** combining accommodation, transportation, activities, and tours.
- **Interactive maps** displaying verified tourism locations from the Pagume database.
- **Booking and payment management** for tourism services.
- **Personalized and agentic travel assistance** instead of a simple question-and-answer chatbot.

## Backend

The Pagume API lives in [`api/`](api/README.md) and uses **local PostgreSQL**. Agents in [`agents/`](agents/README.md) read and write inventory through that HTTP API (never SQL).

```bash
cd api && pip install -e ".[dev]" && pagume-api
cd agents && pagume-agents
```

## Web portals

Provider and admin UIs live in [`portals/`](portals/README.md).

```bash
cd portals && npm install && npm run dev
```

## Docker

Compose runs the API, the agents service, the portals, and a local PostGIS
database that holds a full copy of the Neon data. The API uses Neon whenever it
is reachable and falls back to that local copy when it is not.

### Run (production-style images)

```bash
cp .env.example .env      # fill in DATABASE_URL / GROQ_API_KEY / CLOUDINARY_URL
docker compose up -d --build
# if npm inside Docker times out:
#   cd portals && npm run build && PORTALS_DOCKER_TARGET=prebuilt docker compose up -d --build portals
docker compose --profile sync run --rm mirror
```

| Service | URL | Notes |
|---|---|---|
| portals | http://localhost:8080 | nginx (or Vite when using watch) |
| api | http://localhost:8000 | `/health` reports the active database |
| agents | http://localhost:8100 | reaches the API at `http://api:8000` |
| db | localhost:5434 | local mirror (`DB_HOST_PORT`; default in example is 5433) |

### Run with watch (live reload)

Starts the stack and syncs host file changes into the containers. API/agents
use uvicorn `--reload`; portals runs the Vite dev server with HMR.

```bash
# Stop a previous detached stack if it is already up
docker compose down

docker compose -f docker-compose.yml -f docker-compose.watch.yml watch
```

You should see Compose print watch events when you edit files, for example:

```text
Watch enabled
Syncing service "api" after 1 changes were detected
```

Edit `api/src/...` or `agents/src/...` and the service reloads; edit
`portals/src/...` and Vite hot-reloads in the browser.

`VITE_API_BASE_URL` is baked into the portals production bundle at build time, so
changing it requires rebuilding portals. The default Compose target builds Vite
inside Docker (`runtime`). If npm inside Docker times out, build on the host and
switch targets:

```bash
cd portals && VITE_API_BASE_URL=http://localhost:8000/api/v1 npm ci && npm run build
PORTALS_DOCKER_TARGET=prebuilt docker compose up -d --build portals
```

Schema migrations are never run automatically:

```bash
docker compose run --rm api alembic upgrade head
```

The Flutter app is not containerized. Point it at these ports from
`mobile/lib/core/api/api_config.dart`, then:

```bash
cd mobile && flutter run
```

### Mirroring Neon locally

```bash
docker compose --profile sync run --rm mirror
```

This dumps Neon and restores it into the `db` container using the client tools
inside `postgis/postgis:18-3.6`, so no Postgres client is needed on the host and
the versions match. It then re-applies the offline journal, moves the mirror's
sequences into the offline ID range, and prints a per-table row-count diff. The
job exits non-zero if any table disagrees, so "exact duplicate" is verified
rather than assumed.

Re-run it whenever you want to refresh the copy. It is safe to repeat.

### Working offline

When Neon becomes unreachable the API switches to the mirror on the next
request, keeps re-probing Neon every `DB_PROBE_INTERVAL` seconds, and switches
back on recovery. `/health` shows where it is:

```json
{"status": "ok", "active_target": "local", "failover_enabled": true, "journal_pending": 3}
```

Every write made against the mirror is captured in its `sync_journal` table by
triggers, and offline rows get IDs above 1,000,000,000 so they can never collide
with the IDs Neon hands out in the meantime. On reconnect the journal is
replayed to Neon — automatically when `DB_SYNC_AUTO_PUSH=true`, or by hand:

```bash
docker compose exec api pagume-db-sync --status   # how many writes are waiting
docker compose exec api pagume-db-sync            # replay them to Neon
```

Replay is idempotent (inserts upsert on the primary key) and resumable (each
entry is marked as it lands), so running it twice is harmless. Journal order is
chronological, which keeps parents ahead of children and foreign keys intact.

Two things genuinely need internet and will fail while offline: Cloudinary image
uploads and the agents' Groq LLM. The agent graph degrades to deterministic
templates, so planning still works without the LLM.

**Group 4 Room 1**

| No. | Name                 | ID           |
|-----|----------------------|--------------|
| 1   | Aelaf Eskindir Abebe | CTC-3300-26  |
| 2   | Abel Endale          | CTC-1667-26  |
| 3   | Abigiya Arega        | CTC-10112-26 |
| 4   | Acrosia Tamrat       | CTC-1795-26  |
| 5   | Aaron Teshale        | CTC-181-26   |
| 6   | Abel Yohannis        | CTC-1410-26  |



