"""
tryon.py — FastAPI router for virtual try-on endpoint.
"""

import io
import time
import logging
import cloudinary
import cloudinary.uploader
import httpx
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from app.services.model_runner import run_tryon_model
from app.models.schemas import TryOnResponse

logger = logging.getLogger("ai-service.routes.tryon")

router = APIRouter()

# Cloudinary setup (optional — falls back to base64 data URI)
import os
from dotenv import load_dotenv

load_dotenv()
_has_cloudinary = bool(os.getenv("CLOUDINARY_CLOUD_NAME"))
if _has_cloudinary:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )


async def fetch_image_bytes(url: str) -> bytes:
    """Download image from a URL."""
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content


def upload_to_cloudinary(image_bytes: bytes, folder: str = "fashion/tryon/results") -> str:
    """Upload bytes to Cloudinary and return secure URL."""
    result = cloudinary.uploader.upload(
        image_bytes,
        folder=folder,
        resource_type="image",
        format="jpg",
        quality="auto:good",
    )
    return result["secure_url"]


def bytes_to_data_uri(image_bytes: bytes) -> str:
    """Convert bytes to a base64 JPEG data URI (fallback when no Cloudinary)."""
    import base64
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


@router.post("/tryon", response_model=TryOnResponse)
async def tryon_endpoint(
    user_image_url: str = Form(...),
    garment_image_url: str = Form(...),
):
    """
    Virtual try-on endpoint.

    Accepts URLs for user photo and garment image.
    Returns the URL of the AI-generated composite result.
    """
    start_ms = int(time.time() * 1000)
    logger.info(f"Try-on request | garment: {garment_image_url[:60]}...")

    try:
        # Fetch both images in parallel
        async with httpx.AsyncClient(timeout=30) as client:
            person_resp, garment_resp = await asyncio.gather(
                client.get(user_image_url),
                client.get(garment_image_url),
            )
            person_resp.raise_for_status()
            garment_resp.raise_for_status()
            person_bytes = person_resp.content
            garment_bytes = garment_resp.content

        # Run compositing
        result_bytes = run_tryon_model(person_bytes, garment_bytes)

        # Upload result
        if _has_cloudinary:
            result_url = upload_to_cloudinary(result_bytes)
        else:
            result_url = bytes_to_data_uri(result_bytes)

        processing_time = int(time.time() * 1000) - start_ms
        logger.info(f"Try-on done in {processing_time}ms")

        return TryOnResponse(
            result_url=result_url,
            processing_time_ms=processing_time,
        )

    except httpx.HTTPError as e:
        logger.error(f"Image fetch error: {e}")
        raise HTTPException(status_code=422, detail=f"Failed to fetch image: {str(e)}")
    except RuntimeError as e:
        logger.error(f"Model error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Try-on processing failed")


# Fix missing asyncio import at top level
import asyncio
