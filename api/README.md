# Pagume API

Inventory, trips, and bookings for Pagume Trip. Agents never talk to SQL; they call this HTTP API.

The database is **local PostgreSQL** on this machine (not Docker).

## PostgreSQL (once)

Install Postgres if needed (`postgresql` / `postgresql-contrib` from your distro). Then create the user and database:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER pagume WITH PASSWORD 'pagume';
CREATE DATABASE pagume OWNER pagume;
GRANT ALL PRIVILEGES ON DATABASE pagume TO pagume;
SQL
```

If you already have a local user and database, set `DATABASE_URL` in `.env` to match, for example:

```
postgresql+psycopg://YOUR_USER:YOUR_PASSWORD@localhost:5432/pagume
```

Peer/trust auth (no password) on localhost:

```
postgresql+psycopg://YOUR_OS_USER@localhost:5432/pagume
```

## Setup

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# edit DATABASE_URL if your local Postgres user/password differ
# set CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME for hotel image uploads
pagume-api
```

API: `http://127.0.0.1:8000`  
Docs: `http://127.0.0.1:8000/docs`

Tables are created on startup. Restarting `pagume-api` inserts any **new** seed rows (it does not wipe existing ones). Seeded destinations: Gorgora, Lalibela, Gondar, Bahir Dar, Axum, Harar, Simien Mountains, Addis Ababa, Omo Valley.

### Portal schema (Alembic)

Provider/admin tables live under `pagume_api.portal` and share the same `DATABASE_URL`. Apply migrations:

```bash
cd api
alembic upgrade head
```

Portal HTTP prefix: `/api/v1` (auth, providers, admin, public marketplace). Agent inventory remains under `/v1`.

Portal persistence (beyond inventory): `providerprofile`, `providerdocument`, `portalbooking`, `portalpayment`, `portalreview`, `moderationitem`, `notification`, `platformsetting`, `agentrunlog`, plus destination fields `woreda` / historical / accessibility / seasonal. Migration: `003_portal_persistence`.

Seed adds `admin@pagume.et` / `hotel@seed.et` (password `password123`) with a pending profile, sample booking/payment/review/notification when empty.

| Role | Frontend portal |
|------|-----------------|
| `HOTEL_PROVIDER` | `/hotel` |
| `TOUR_AGENCY` | `/agency` |
| `CAR_RENTAL` | `/car-rental` |
| `DRIVER` / `GUIDE` | `/driver` |
| `ADMIN` | `/admin` (login at `/admin/login`) |
| (public) | `/marketplace` |

Manual Postman prompts: [TEST_CASES.md](TEST_CASES.md).

## Point the agents at this API

In `agents/.env`:

```
INVENTORY_CLIENT=http
PAGUME_API_BASE_URL=http://127.0.0.1:8000
```

Restart `pagume-agents`. Tools then read and write this database through HTTP.

## Agent-facing routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/destinations` | Search |
| POST | `/v1/destinations` | Create |
| GET | `/v1/destinations/{id}` | Get |
| GET | `/v1/destinations/{id}/nearby` | Nearby |
| GET/POST | `/v1/hotels` | Search / create |
| GET | `/v1/hotels/{id}` | Details |
| GET | `/v1/hotels/{id}/rooms` | Rooms |
| GET | `/v1/hotels/{id}/rooms/{room_id}/availability` | Room dates |
| GET/POST | `/v1/transport` | Search / create vehicle |
| GET | `/v1/car-rentals` | Car rental search |
| GET | `/v1/vehicles/{id}/availability` | Vehicle dates |
| GET/POST | `/v1/tours` | Search / create |
| GET | `/v1/tours/{id}` | Details |
| GET | `/v1/tours/{id}/availability` | Tour seats/date |
| POST | `/v1/trips` | Create trip |
| GET | `/v1/trips/{id}` | Get trip |
| PUT | `/v1/trips/{id}/itinerary` | Save itinerary |
| POST | `/v1/bookings/prepare` | Hold booking (`Idempotency-Key`) |
| POST | `/v1/bookings/{id}/confirm` | Confirm (`Idempotency-Key`) |
| POST | `/v1/bookings/{id}/cancel` | Cancel (`Idempotency-Key`) |

## Tests

Pytest uses a temporary SQLite file so you do not need Postgres running for `pytest`.

```bash
pytest
```
