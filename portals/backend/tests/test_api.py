import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_root(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
    assert "Welcome to" in response.json()["message"]


@pytest.mark.asyncio
async def test_public_destinations(async_client: AsyncClient):
    response = await async_client.get("/api/v1/public/destinations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_public_hotels(async_client: AsyncClient):
    response = await async_client.get("/api/v1/public/hotels")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient):
    user_data = {
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Test User",
        "role": "TRAVELER"
    }
    response = await async_client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user_data["email"]
    assert "id" in data
    assert data["role"] == "TRAVELER"

@pytest.mark.asyncio
async def test_register_duplicate_user(async_client: AsyncClient):
    user_data = {
        "email": "duplicate@example.com",
        "password": "testpassword"
    }
    # Register first time
    response1 = await async_client.post("/api/v1/auth/register", json=user_data)
    assert response1.status_code == 200
    
    # Register second time
    response2 = await async_client.post("/api/v1/auth/register", json=user_data)
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"]
