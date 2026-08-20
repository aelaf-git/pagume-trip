# Pagume Portals (React + Vite)

Provider-admin UI for Pagume Trip. Hotels, tour agencies, and car rentals register by category, share one **provider** login, then manage **their** inventory in category-specific admin surfaces. Pagume **administrators** use a separate login. A public browse (`/marketplace`) is secondary — not the product entry.

## Product flow

1. **Register** at `/register` → pick category (`hotel`, `agency`, `transport`, `driver`) → `/register/:type`.
2. **Provider sign in** at `/login` (shared for hotel, agency, car rental, driver).
3. **Redirect by role** to the matching portal:
   - `HOTEL_PROVIDER` → `/hotel/dashboard` (Property + Rooms)
   - `TOUR_AGENCY` → `/agency/dashboard` (Packages)
   - `CAR_RENTAL` → `/car-rental/dashboard` (Fleet)
   - `DRIVER` → `/driver/dashboard`
4. **Admin sign in** at `/admin/login` → `/admin/dashboard` (separate from providers).
5. Optionally open **Public browse** at `/marketplace` for verified listings (no login required).

```
/login (providers) ──┬── HOTEL_PROVIDER  → /hotel/*
                     ├── TOUR_AGENCY     → /agency/*
                     ├── CAR_RENTAL      → /car-rental/*
                     └── DRIVER          → /driver/*

/admin/login ──────────── ADMIN           → /admin/*
```

## Setup

```bash
cd portals/Frontend
npm install
npm run dev
```

Default API base: `http://localhost:8000/api/v1` (override with `VITE_API_BASE_URL`).

Start the unified API first (`cd api && pagume-api` and `alembic upgrade head` if needed).

## Routes

| Path | Audience |
|------|----------|
| `/` | Redirects to `/login` |
| `/login` | Provider JWT login (`/api/v1/auth/login`) |
| `/admin/login` | Administrator JWT login (same API, ADMIN role only) |
| `/register` / `/register/:type` | Provider onboarding by category |
| `/hotel/*` | Hotel / resort provider admin |
| `/agency/*` | Travel agency admin |
| `/car-rental/*` | Car rental admin |
| `/driver/*` | Independent driver / guide admin |
| `/admin/*` | Pagume administrators (requires `/admin/login`) |
| `/marketplace` | Public browse of verified listings (secondary) |

## Checklist

1. Register a hotel provider with email + password, then sign in at `/login` → `/hotel`.
2. Save property under **Property**, add rooms under **Rooms**.
3. Sign in as admin at `/admin/login`, then verify the user (`PUT /api/v1/admin/users/{id}/verify`) so listings appear on `/marketplace`.
4. Agency / car-rental / driver portals follow the same pattern for packages, fleet, and driver profile.
