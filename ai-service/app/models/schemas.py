from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any


class TryOnRequest(BaseModel):
    """Request body for try-on when sending URLs (non-multipart)."""
    user_image_url: str
    garment_image_url: str
    user_height_cm: Optional[float] = 175.0
    num_inference_steps: Optional[int] = 25


class TryOnResponse(BaseModel):
    """Response from the try-on endpoint."""
    result_url: str
    processing_time_ms: int
    success: bool = True
    message: Optional[str] = None
    sizing_advisory: Optional[Dict[str, Any]] = None
    telemetry: Optional[Dict[str, Any]] = None

