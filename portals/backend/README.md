# Pagume Trip - Backend Service

This is the FastAPI backend service for the Pagume Trip platform. It handles authentication, provider inventory management, and serves as the core API for both the Web Portals and the mobile application.

This guide is specifically written for frontend developers who need to run the backend locally to test their integrations.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
1. **Python 3.11 or higher**
2. **uv**: A fast Python package installer and resolver. 
   - Install via curl (Mac/Linux): `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Install via powershell (Windows): `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
3. **PostgreSQL**: You must have a local PostgreSQL database server running.

## Local Setup Instructions

### 1. Database Configuration
Ensure your local PostgreSQL server is running on the default port `5432`.
Create a database named `pagume_trip`. 

The backend expects the following default credentials (you can change these in `src/core/config.py` if your local setup is different):
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `pagume_trip`

### 2. Install Dependencies
Navigate into this backend directory and use `uv` to sync the environment. This will automatically create a virtual environment and install all required packages.

```bash
cd portals/backend
uv sync
```

### 3. Run Database Migrations
Before starting the server, you must generate the tables in your PostgreSQL database. Run the following command to apply the Alembic migrations:

```bash
uv run alembic upgrade head
```

### 4. Start the Development Server
Start the FastAPI development server with hot-reloading enabled:

```bash
uv run fastapi dev main.py
```

The backend is now running locally at: `http://localhost:8000`

## API Documentation and Integration

Once the server is running, you can access the automatically generated interactive API documentation. This is the fastest way to understand the request/response shapes and test endpoints directly from your browser.

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

For detailed instructions on Authentication flows (how to get and use JWT tokens), validation rules, and a breakdown of the specific endpoints, please read the `API_DOCUMENTATION.md` located in the parent `portals` directory.

## Troubleshooting

- "Connection refused" errors: Ensure your PostgreSQL service is actually running.
- "Database pagume_trip does not exist": Ensure you created the database in pgAdmin or via the psql command line before running migrations.
- "uv command not found": Ensure you restarted your terminal after installing `uv` so it is added to your system PATH.
