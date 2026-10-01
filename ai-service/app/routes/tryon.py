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
import io
import cloudinary
import cloudinary.uploader
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from concurrent.futures import ThreadPoolExecutor

from app.services.model_runner import run_tryon_model
from app.services.catvton_worker import vton_worker
from app.services.sizing_engine import extract_pose_and_measure
from app.models.schemas import TryOnResponse, TryOnRequest

logger = logging.getLogger("ai-service.routes.tryon")

router = APIRouter()

# Thread pool for blocking inference calls
_executor = ThreadPoolExecutor(max_workers=4)

# Detect active backend
_backend = os.getenv("TRYON_BACKEND", "catvton").lower()
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
    user_height_cm: float = Form(175.0),
    num_inference_steps: int = Form(25),
):
    """
    Virtual try-on endpoint.
    Processes user photo and garment image, generating CatVTON output + anthropometric sizing.
    """
    start_ms = int(time.time() * 1000)
    log_url = garment_image_url[:60] + ("..." if len(garment_image_url) > 60 else "")
    logger.info(f"Try-on request [{_backend}] | garment: {log_url} | height: {user_height_cm}cm")

    try:
        # Fetch both images in parallel
        async with httpx.AsyncClient(timeout=60) as client:
            person_resp, garment_resp = await asyncio.gather(
                client.get(user_image_url),
                client.get(garment_image_url),
            )
            person_resp.raise_for_status()
            garment_resp.raise_for_status()
            person_bytes = person_resp.content
            garment_bytes = garment_resp.content

        loop = asyncio.get_event_loop()

        if _backend in ["catvton", "demo", "colab"]:
            # Run modernized CatVTON worker with automated masking and sizing engine
            worker_result = await loop.run_in_executor(
                _executor,
                vton_worker.run_tryon,
                person_bytes,
                garment_bytes,
                user_height_cm,
                num_inference_steps,
            )
            result_bytes = worker_result["result_bytes"]
            sizing_advisory = worker_result.get("sizing_advisory")
            telemetry = worker_result.get("telemetry")
        else:
            # Fallback legacy runner
            result_bytes = await loop.run_in_executor(
                _executor,
                run_tryon_model,
                person_bytes,
                garment_bytes,
            )
            sizing_advisory = extract_pose_and_measure(person_bytes, user_height_cm=user_height_cm)
            telemetry = None

        # Upload result
        if _has_cloudinary:
            result_url = upload_to_cloudinary(result_bytes)
        else:
            result_url = bytes_to_data_uri(result_bytes)

        processing_time = int(time.time() * 1000) - start_ms
        logger.info(f"Try-on completed in {processing_time}ms | size: {sizing_advisory.get('recommended_size')}")

        return TryOnResponse(
            result_url=result_url,
            processing_time_ms=processing_time,
            sizing_advisory=sizing_advisory,
            telemetry=telemetry,
        )

    except httpx.HTTPError as e:
        logger.error(f"Image fetch error: {e}")
        raise HTTPException(status_code=422, detail=f"Failed to fetch image: {str(e)}")
    except Exception as e:
        logger.error(f"Try-on error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/internal/inference")
async def internal_inference(
    user_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    num_inference_steps: int = Form(25),
    user_height_cm: float = Form(175.0),
):
    """
    Direct internal inference route adhering to the engineering specification.
    """
    person_bytes = await user_image.read()
    garment_bytes = await garment_image.read()

    loop = asyncio.get_event_loop()
    worker_result = await loop.run_in_executor(
        _executor,
        vton_worker.run_tryon,
        person_bytes,
        garment_bytes,
        user_height_cm,
        num_inference_steps,
    )

    import base64
    result_b64 = base64.b64encode(worker_result["result_bytes"]).decode("utf-8")
    return {
        "status": "SUCCESS",
        "result_image_base64": result_b64,
        "sizing_advisory": worker_result.get("sizing_advisory"),
        "telemetry": worker_result.get("telemetry"),
    }


