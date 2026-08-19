import os
import time
import cloudinary
import cloudinary.utils
from fastapi import APIRouter, Depends
from src.api.deps import get_current_active_user
from src.db.models.user import User
from src.core.config import settings

router = APIRouter()

# Cloudinary looks for CLOUDINARY_URL in os.environ
if settings.CLOUDINARY_URL:
    os.environ["CLOUDINARY_URL"] = settings.CLOUDINARY_URL
    import cloudinary.api # This forces cloudinary to re-evaluate the environment variables
    # We can also parse the URL explicitly
    import re
    match = re.match(r"cloudinary://([^:]+):([^@]+)@(.+)", settings.CLOUDINARY_URL)
    if match:
        cloudinary.config(
            api_key=match.group(1),
            api_secret=match.group(2),
            cloud_name=match.group(3)
        )

@router.get("/signature")
async def get_cloudinary_signature(current_user: User = Depends(get_current_active_user)):
    """
    Generates an authentication signature so the frontend can upload files
    directly to Cloudinary securely, bypassing our backend.
    """
    timestamp = int(time.time())
    
    # Generate signature using Cloudinary utils
    signature = cloudinary.utils.api_sign_request(
        {"timestamp": timestamp},
        cloudinary.config().api_secret
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "api_key": cloudinary.config().api_key,
        "cloud_name": cloudinary.config().cloud_name
    }
