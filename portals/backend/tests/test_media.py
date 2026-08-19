import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_cloudinary_signature(async_client: AsyncClient):
    """
    Test that an authenticated user can request a Cloudinary upload signature.
    This allows the frontend to upload images directly to Cloudinary without
    sending the heavy image payload through our FastAPI backend.
    """
    # Register and login a user to get token
    await async_client.post("/api/v1/auth/register", json={
        "email": "testmedia@example.com",
        "password": "password123",
        "full_name": "Test Media",
        "role": "TRAVELER"
    })
    
    login_res = await async_client.post("/api/v1/auth/login", data={
        "username": "testmedia@example.com",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    
    response = await async_client.get(
        "/api/v1/media/signature",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify the response contains the necessary fields for Cloudinary frontend upload
    assert "signature" in data
    assert "timestamp" in data
    assert "api_key" in data
    assert "cloud_name" in data
    
    # Ensure the API key and cloud name match what we expect
    assert data["api_key"] == "996717483356582"
    assert data["cloud_name"] == "micmcyg2"

@pytest.mark.asyncio
async def test_get_cloudinary_signature_unauthorized(async_client: AsyncClient):
    """
    Test that an unauthenticated user CANNOT request an upload signature.
    """
    response = await async_client.get("/api/v1/media/signature")
    assert response.status_code == 401
