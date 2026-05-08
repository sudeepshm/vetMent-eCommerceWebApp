"""
tryon.py — FastAPI router for virtual try-on endpoint.

When TRYON_BACKEND=hf_space, inference takes 30–90s.
The gradio_client call is blocking (sync), so we run it
in a thread executor to avoid stalling FastAPI's event loop.
"""

import asyncio
import time
import logging
import os
import cloudinary
import cloudinary.uploader
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Form, HTTPException
from concurrent.futures import ThreadPoolExecutor

from app.services.model_runner import run_tryon_model
from app.models.schemas import TryOnResponse

logger = logging.getLogger("ai-service.routes.tryon")

router = APIRouter()

# Thread pool for blocking inference calls (gradio_client is synchronous)
_executor = ThreadPoolExecutor(max_workers=3)

# Detect active backend for logging
_backend = os.getenv("TRYON_BACKEND", "demo").lower()
_is_hf_space = _backend == "hf_space"

# Cloudinary setup (optional — falls back to base64 data URI)
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
    
    Latency:
      demo     → <2s  (PIL compositing)
      hf_space → 30–90s (IDM-VTON on HuggingFace GPU)
    """
    start_ms = int(time.time() * 1000)
    log_url = garment_image_url[:60] + ("..." if len(garment_image_url) > 60 else "")
    
    if _is_hf_space:
        logger.info(f"Try-on request [IDM-VTON / HF Space] | garment: {log_url}")
        logger.info("⏳ HF Space inference may take 30–90s depending on queue...")
    else:
        logger.info(f"Try-on request [{_backend}] | garment: {log_url}")

    try:
        # Fetch both images in parallel (60s timeout — Cloudinary URLs can be slow)
        async with httpx.AsyncClient(timeout=60) as client:
            person_resp, garment_resp = await asyncio.gather(
                client.get(user_image_url),
                client.get(garment_image_url),
            )
            person_resp.raise_for_status()
            garment_resp.raise_for_status()
            person_bytes = person_resp.content
            garment_bytes = garment_resp.content

        # Run model inference in thread executor (gradio_client is blocking)
        # HF Space can take up to 90s — we give it 180s before timing out
        loop = asyncio.get_event_loop()
        result_bytes = await asyncio.wait_for(
            loop.run_in_executor(
                _executor,
                run_tryon_model,
                person_bytes,
                garment_bytes,
            ),
            timeout=180.0,
        )

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
    except asyncio.TimeoutError:
        logger.error("HuggingFace Space timed out after 180s")
        raise HTTPException(
            status_code=504,
            detail="Try-on timed out. HuggingFace Space is busy — please retry in a minute.",
        )
    except RuntimeError as e:
        logger.error(f"Model error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Try-on processing failed")

