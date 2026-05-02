"""
model_runner.py

Virtual try-on generation service.

Architecture:
  - Currently: Realistic garment compositing using PIL (demo mode)
  - Pluggable: Replace `run_tryon_model()` with real model inference
    (e.g., OOTDiffusion, IDM-VTON, DCI-VTON) when GPU environment is available.

Demo approach:
  1. Normalize both images to standard size
  2. Extract garment region (remove background)
  3. Detect upper-body torso region in person image using simple heuristics
  4. Resize garment to fit that region
  5. Composite with alpha blending for a realistic result
"""

import logging
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
from app.services.image_processing import (
    normalize_image,
    extract_garment_region,
    to_numpy,
    from_numpy,
    image_to_bytes,
)

logger = logging.getLogger("ai-service.model_runner")

# Constants
PERSON_SIZE = (512, 768)  # Standard portrait size
GARMENT_SCALE = 0.55      # Garment takes ~55% of torso width


def detect_torso_region(person_np: np.ndarray) -> tuple:
    """
    Estimate the torso bounding box in normalized coordinates.
    Heuristic: torso occupies roughly the middle 60% width and
    top 25-65% height of a standing portrait.
    Returns (x, y, w, h) in pixels.
    """
    h, w = person_np.shape[:2]
    x = int(w * 0.20)
    y = int(h * 0.22)
    box_w = int(w * 0.60)
    box_h = int(h * 0.42)
    return x, y, box_w, box_h


def apply_garment_to_person(
    person_img: Image.Image,
    garment_img: Image.Image,
    opacity: float = 0.88,
) -> Image.Image:
    """
    Composite garment onto the person image.

    Steps:
      1. Normalize images
      2. Extract garment with alpha mask
      3. Detect torso region
      4. Resize garment to fit torso
      5. Apply soft shadow and color correction
      6. Blend with person image
    """
    # 1. Normalize
    person = normalize_image(person_img, PERSON_SIZE)
    garment = normalize_image(garment_img, PERSON_SIZE)

    # 2. Extract garment region
    garment_rgba = extract_garment_region(garment)

    # 3. Torso region
    person_np = to_numpy(person)
    x, y, gw, gh = detect_torso_region(person_np)

    # 4. Resize garment to fit torso
    garment_resized = garment_rgba.resize((gw, gh), Image.LANCZOS)

    # 5. Subtle color grading to match person lighting
    enhancer = ImageEnhance.Brightness(garment_resized)
    garment_resized = enhancer.enhance(0.92)

    # 6. Apply slight Gaussian blur on edges for natural blending
    garment_blurred = garment_resized.filter(ImageFilter.SMOOTH_MORE)

    # 7. Adjust alpha channel for opacity
    r, g, b, a = garment_blurred.split()
    a = a.point(lambda v: int(v * opacity))
    garment_final = Image.merge("RGBA", (r, g, b, a))

    # 8. Composite onto person
    result = person.convert("RGBA")
    result.paste(garment_final, (x, y), mask=garment_final)

    return result.convert("RGB")


def run_tryon_model(
    person_bytes: bytes,
    garment_bytes: bytes,
) -> bytes:
    """
    Main entry point for try-on generation.

    Args:
        person_bytes: Raw bytes of the user's photo
        garment_bytes: Raw bytes of the garment image

    Returns:
        JPEG bytes of the composited result

    To integrate a real model:
        - Replace the body of this function with your model's inference call
        - The function signature and return type remain the same
    """
    logger.info("Starting try-on generation (demo compositing mode)")

    try:
        person_img = Image.open(__import__("io").BytesIO(person_bytes)).convert("RGBA")
        garment_img = Image.open(__import__("io").BytesIO(garment_bytes)).convert("RGBA")

        result_img = apply_garment_to_person(person_img, garment_img)
        result_bytes = image_to_bytes(result_img, fmt="JPEG", quality=90)

        logger.info(f"Try-on complete. Output size: {len(result_bytes)} bytes")
        return result_bytes

    except Exception as e:
        logger.error(f"Try-on generation failed: {e}")
        raise RuntimeError(f"Model runner error: {e}") from e
