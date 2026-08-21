"""Upload images to Cloudinary. Credentials come from CLOUDINARY_URL only."""

from __future__ import annotations

import re
from typing import BinaryIO
from urllib.parse import unquote, urlparse

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

from pagume_api.config import get_settings

_ALLOWED_KINDS = frozenset({"cover", "profile", "gallery"})
_MAX_BYTES = 8 * 1024 * 1024  # 8 MiB
_CONTENT_TYPES = frozenset(
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
    }
)
_configured = False


def _configure() -> None:
    """Apply CLOUDINARY_URL.

    Do not pass ``cloudinary_url=`` into ``cloudinary.config()`` — the SDK stores
    it as a plain attribute and never parses api_key / api_secret from it.
    """
    global _configured
    url = (get_settings().cloudinary_url or "").strip()
    if not url:
        raise HTTPException(
            status_code=503,
            detail="Image uploads are not configured. Set CLOUDINARY_URL in the API .env.",
        )

    if _configured and cloudinary.config().api_key:
        return

    parsed = urlparse(url)
    if parsed.scheme != "cloudinary" or not parsed.hostname:
        raise HTTPException(
            status_code=503,
            detail="CLOUDINARY_URL must look like cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
        )

    cloudinary.config(
        cloud_name=parsed.hostname,
        api_key=unquote(parsed.username or ""),
        api_secret=unquote(parsed.password or ""),
        secure=True,
    )
    if not cloudinary.config().api_key or not cloudinary.config().api_secret:
        raise HTTPException(
            status_code=503,
            detail="CLOUDINARY_URL is missing api_key or api_secret.",
        )
    _configured = True


def _safe_folder(kind: str) -> str:
    if kind not in _ALLOWED_KINDS:
        raise HTTPException(
            status_code=400,
            detail=f"kind must be one of: {', '.join(sorted(_ALLOWED_KINDS))}",
        )
    return f"pagume/hotels/{kind}"


async def upload_hotel_image(file: UploadFile, kind: str = "gallery") -> dict:
    """Upload a hotel image; returns secure_url and public_id."""
    _configure()
    folder = _safe_folder(kind)

    content_type = (file.content_type or "").lower()
    if content_type not in _CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WebP, or GIF images are allowed.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > _MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 8 MB or smaller.")

    filename = file.filename or "upload"
    filename = re.sub(r"[^\w.\-]+", "_", filename)[:120]

    try:
        result = cloudinary.uploader.upload(
            data,
            folder=folder,
            resource_type="image",
            use_filename=True,
            unique_filename=True,
            overwrite=False,
            filename_override=filename,
        )
    except Exception as exc:  # noqa: BLE001 — surface Cloudinary errors cleanly
        raise HTTPException(
            status_code=502,
            detail=f"Cloudinary upload failed: {exc}",
        ) from exc

    url = result.get("secure_url") or result.get("url")
    if not url:
        raise HTTPException(status_code=502, detail="Cloudinary did not return a URL.")

    return {
        "url": url,
        "public_id": result.get("public_id"),
        "kind": kind,
        "width": result.get("width"),
        "height": result.get("height"),
        "format": result.get("format"),
        "size": result.get("bytes"),
    }


def upload_bytes(stream: BinaryIO, folder: str) -> dict:
    """Sync helper for scripts/tests."""
    _configure()
    return cloudinary.uploader.upload(stream, folder=folder, resource_type="image")
