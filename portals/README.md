# Pagume Portals (React + Vite)

Provider-admin UI for Pagume Trip. Hotels, tour agencies, and car rentals register by category, share one **provider** login, then manage **their** inventory in category-specific surfaces. Pagume **administrators** use `/admin/login`. Public browse (`/marketplace`) is secondary.

Almost all portal screens read/write the unified API database (`/api/v1`) — inventory, registration profiles, admin verification, destinations, bookings, payments, reviews, notifications, and settings.

## Product flow

1. **Register** at `/register` → category → business details + document metadata persisted as `providerprofile` / `providerdocument`.
2. **Provider sign in** at `/login` → role redirect (`/hotel`, `/agency`, `/car-rental`, `/driver`).
3. **Admin sign in** at `/admin/login` → verify providers, manage destinations/users, review bookings/payments/settings.
4. Optional **Public browse** at `/marketplace`.

## Setup

```bash
cd portals
npm install
npm run dev
```

Default API base: `http://localhost:8000/api/v1` (override with `VITE_API_BASE_URL`).

Portal requirements and API notes: [`docs/`](docs/).

```bash
cd api && alembic upgrade head && pagume-api
```

## Routes

| Path | Audience |
|------|----------|
| `/` | → `/login` |
| `/login` | Provider login |
| `/admin/login` | Admin login |
| `/register` / `/register/:type` | Provider onboarding |
| `/hotel/*` `/agency/*` `/car-rental/*` `/driver/*` | Category admin (inventory, bookings, payments, reviews) |
| `/admin/*` | Platform admin (no Reports stub) |
| `/marketplace` | Public verified listings |

## Layout

```text
portals/
├── public/                  # Favicon and static files
├── src/
│   ├── assets/branding/     # Logo and brand marks
│   ├── components/
│   ├── constants/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   └── utils/
├── docs/                    # Portal requirements and API notes
├── index.html
├── package.json
└── vite.config.js
```

## Checklist

1. Register a hotel → sign in → Property + Rooms.
2. Admin at `/admin/login` → Provider Management → verify → listings appear on `/marketplace`.
3. Confirm a booking → payment row appears under Payments.
