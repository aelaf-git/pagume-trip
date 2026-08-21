# Pagume Trip - Technical Specifications

This document outlines the consolidated technical architecture, technology stack, and engineering standards for both the **Backend API / AI Multi-Agent System** and the **Web Portals** (Provider and Administration) for the Pagume Trip project.

---

## 1. Unified Architecture Overview

Pagume Trip operates on a modern, decoupled architecture. The database acts as the single source of truth for the marketplace. The Provider Portals supply and manage this inventory. The AI Multi-Agent System operates on that inventory to plan and execute trips on behalf of the traveler, while strictly adhering to business logic enforced by the central Backend Service Layer.

```text
┌─────────────────────────────────────────────────────────┐
│               Frontend Presentation Layer               │
│                                                         │
│  ┌───────────────────┐           ┌───────────────────┐  │
│  │   Traveler App    │           │    Web Portals    │  │
│  │     (Flutter)     │           │     (Next.js)     │  │
│  └─────────┬─────────┘           └─────────┬─────────┘  │
└────────────┼───────────────────────────────┼────────────┘
             │                               │
┌────────────▼───────────────────────────────▼────────────┐
│                    API Gateway & Auth                   │
│         (JWT Verification, Rate Limiting, RBAC)         │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│               Backend Service Layer (FastAPI)           │
│   (Bookings, Inventory, Payment, Provider Management)   │
└────────────┬───────────────────────────────▲────────────┘
             │                               │
┌────────────▼───────────────────────────────┴────────────┐
│                  AI Multi-Agent System                  │
│    (Supervisor, Destination, Budget, Booking Agents)    │
│    * Agents interact with the Service Layer via Tools   │
└────────────┬────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────┐
│                 Data Access Layer (ORMs)                │
│          (PostgreSQL, PostGIS, pgvector, Redis)         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Backend & AI Architecture Specifications

### 2.1 Backend Technology Stack
*   **Core Framework**: FastAPI (Python 3.11+) - chosen for native async support, high performance, and seamless integration with Python AI ecosystems.
*   **ORMs**: SQLAlchemy for relational data, GeoAlchemy2 for spatial data, and pgvector-python.
*   **Databases**:
    *   **PostgreSQL**: Primary transactional database.
    *   **PostGIS**: Geospatial extension for mapping and distance calculations.
    *   **pgvector**: Vector extension for semantic/natural language AI searches.
    *   **Redis**: Caching, session management, and temporary availability locks.
*   **Storage**: AWS S3 (or MinIO) for media uploads from portals.

### 2.2 AI Multi-Agent System
*   **Orchestration Framework**: LangGraph or CrewAI.
*   **Models**: OpenAI (GPT-4o) or Anthropic (Claude 3.5 Sonnet).
*   **Design Principle**: Agents **must not** query the database directly. They are restricted to predefined `Tools` that route through the Service Layer.
*   **Permission Levels**:
    1.  `READ`: Search and fetch availability (No user approval needed).
    2.  `PREPARE`: Draft itineraries and tentative bookings (User review needed).
    3.  `TRANSACTIONAL`: Execute payments and final bookings (Requires explicit User Authorization).

### 2.3 Backend Directory Structure
```text
backend/
├── src/
│   ├── api/                    # FastAPI routers (admin, mobile, provider endpoints)
│   ├── core/                   # Security, config, JWT middleware
│   ├── db/                     # SQLAlchemy models, Alembic migrations
│   ├── schemas/                # Pydantic validation schemas
│   ├── services/               # Core business logic
│   └── agents/                 # AI System (supervisor, specialized agents, tools)
└── main.py                     # Entry point
```

### 2.4 Security & Transaction Safety
*   **Idempotency Keys**: All transactional API routes (`POST /bookings`, `POST /payments`) require idempotency keys to prevent double-booking.
*   **Real-time Communication**: WebSockets will stream AI agent thoughts to the mobile app and push instant booking notifications to the provider portals.

---

## 3. Web Portals (Provider & Admin) Specifications

### 3.1 Portal Technology Stack
*   **Core Framework**: Next.js (App Router) with TypeScript (Strict mode).
*   **Rendering**: Server-Side Rendering (SSR) for initial load, Client-Side Rendering (CSR) for interactive dashboards.
*   **Styling & UI**: Tailwind CSS, shadcn/ui components, and Framer Motion for micro-interactions.
*   **State Management**:
    *   Server State: TanStack Query (React Query).
    *   Client State: Zustand.
*   **Form Handling**: React Hook Form combined with Zod for robust client-side validation.

### 3.2 Portal Directory Structure
```text
portals/
├── public/                     # Favicon and static files
├── src/
│   ├── assets/branding/        # Logo and brand marks
│   ├── components/             # Shared UI (layout, forms, admin, inventory)
│   ├── constants/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/                # Admin, hotel, agency, car-rental, driver
│   ├── pages/                  # Auth, admin, provider, marketplace screens
│   ├── routes/
│   ├── services/               # API clients
│   └── utils/
├── docs/                       # Portal requirements and API notes
├── index.html
├── package.json
└── vite.config.js
```

### 3.3 Core Portal Features
*   **Role-Based Access Control (RBAC)**: Middleware protects routes based on user role (`ADMIN`, `HOTEL_PROVIDER`, `TOUR_AGENCY`, `CAR_RENTAL`, `DRIVER`).
*   **Complex Form Architecture**: Multi-step wizards for inventory creation (e.g., adding a new hotel room or a multi-day tour package) handled strictly via Zod and React Hook Form to ensure data integrity before API submission.
*   **Direct-to-Cloud Uploads**: Heavy assets (vehicle images, hotel room photos) use pre-signed URLs to upload directly to S3, avoiding backend bottlenecks.
*   **Real-Time Dashboards**: Portals will listen to WebSocket/SSE connections to update inventory availability or booking requests the moment an AI agent makes a reservation.

---

## 4. Deployment & DevOps Strategy

*   **Containerization**: Docker will be used to containerize both the FastAPI backend and Next.js portals ensuring parity across environments.
*   **Orchestration**: Kubernetes (K8s) is recommended to scale the heavy AI agent microservices independently from the fast, transactional REST APIs.
*   **CI/CD**: GitHub Actions for automated unit testing (especially for price calculations and AI tool schemas), linting (ESLint/Prettier), and deployment.
*   **Observability**: Tools like Sentry (for error tracking) and PostHog (for tracking analytics like "AI Recommendation Views") will be integrated into the portals and backend.