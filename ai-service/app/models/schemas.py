from pydantic import BaseModel, HttpUrl
from typing import Optional


class TryOnRequest(BaseModel):
    """Request body for try-on when sending URLs (non-multipart)."""
    user_image_url: str
    garment_image_url: str


class TryOnResponse(BaseModel):
    """Response from the try-on endpoint."""
    result_url: str
    processing_time_ms: int
    success: bool = True
    message: Optional[str] = None
