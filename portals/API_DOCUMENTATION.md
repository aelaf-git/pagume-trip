# Pagume Trip - Backend API Documentation

This document provides frontend developers with the necessary details to consume the Pagume Trip Backend API.

## Starting the Backend Locally

To test the APIs locally alongside your Next.js/React frontend:
1. Navigate to the backend folder: `cd portals/backend`
2. Sync the environment: `uv sync`
3. Ensure PostgreSQL is running on `localhost:5432` with a database named `pagume_trip` (user: `postgres`, pass: `postgres`).
4. Run migrations: `uv run alembic upgrade head`
5. Start the server: `uv run fastapi dev main.py`

## Base URL
When running locally, the API is available at: `http://localhost:8000`

The fastest way to test and understand the API shape is via the automatically generated interactive docs:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Authentication
The API uses standard OAuth2 with JWT (JSON Web Tokens).

### 1. Register a new user
**POST** `/api/v1/auth/register`
```json
{
  "email": "provider@example.com",
  "password": "strongpassword123",
  "full_name": "John Doe",
  "role": "HOTEL_PROVIDER" // Roles: TRAVELER, HOTEL_PROVIDER, TOUR_AGENCY, CAR_RENTAL, ADMIN, DRIVER, GUIDE
}
```

### 2. Login (Get Access Token)
**POST** `/api/v1/auth/login`
**Content-Type**: `application/x-www-form-urlencoded`
**Body**: `username=provider@example.com&password=strongpassword123`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "token_type": "bearer"
}
```

### 3. Authenticated Requests
For endpoints requiring authentication, you must include the token in the `Authorization` header:
```
Authorization: Bearer <your_access_token>
```

---

## Public Endpoints (No Auth Required)
These endpoints are used for searching and displaying inventory to travelers (or the AI Agents).
- **GET** `/api/v1/public/destinations` - View active destinations
- **GET** `/api/v1/public/hotels` - Browse hotels
- **GET** `/api/v1/public/tours` - Browse tour packages
- **GET** `/api/v1/public/vehicles` - Browse rental vehicles

---

## Provider Endpoints (Auth Required)
These endpoints are RBAC-protected. Only users with the matching provider role can access them.

### Hotels (Requires `HOTEL_PROVIDER` or `ADMIN`)
- **POST** `/api/v1/providers/hotels`: Create a new hotel.
- **GET** `/api/v1/providers/hotels`: List hotels owned by the current logged-in user.
- **POST** `/api/v1/providers/hotels/{hotel_id}/rooms`: Add a room to a specific hotel.
- **GET** `/api/v1/providers/hotels/{hotel_id}/rooms`: List rooms for a hotel.

### Tours (Requires `TOUR_AGENCY` or `ADMIN`)
- **POST** `/api/v1/providers/tours`: Create a new tour package.
- **GET** `/api/v1/providers/tours`: List tours owned by the agency.

### Vehicles (Requires `CAR_RENTAL` or `ADMIN`)
- **POST** `/api/v1/providers/vehicles`: Register a new vehicle.
- **GET** `/api/v1/providers/vehicles`: List vehicles owned by the company.

---

## Admin Endpoints (Auth Required)
Requires the `ADMIN` role.

- **PUT** `/api/v1/admin/users/{user_id}/verify`: Verify a provider (e.g. after they submit documents).
- **POST** `/api/v1/admin/destinations`: Add a new official destination to the platform.
- **GET** `/api/v1/admin/destinations`: List all destinations.
