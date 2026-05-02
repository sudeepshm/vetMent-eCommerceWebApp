"""
preprocess.py

Image preprocessing utilities for the AI service.
Handles resizing, normalization, and format conversion
before feeding images into the compositing pipeline.
"""

import io
import logging
from PIL import Image, ImageOps
import numpy as np

logger = logging.getLogger("ai-service.utils.preprocess")

# Standard dimensions for the try-on model
PERSON_TARGET_SIZE = (512, 768)     # (width, height)
GARMENT_TARGET_SIZE = (384, 512)    # (width, height)


def load_image_bytes(raw_bytes: bytes) -> Image.Image:
    """Load a PIL Image from raw bytes, converting to RGBA."""
    img = Image.open(io.BytesIO(raw_bytes))
    return img.convert("RGBA")


def resize_with_padding(
    img: Image.Image,
    target_size: tuple[int, int],
    background_color: tuple[int, int, int, int] = (255, 255, 255, 255),
) -> Image.Image:
    """
    Resize image to fit within target_size while preserving aspect ratio.
    Pads any remaining space with background_color (default: white).

    Args:
        img:              PIL Image (any mode)
        target_size:      (width, height) tuple
        background_color: RGBA fill color for padding

    Returns:
        RGBA PIL Image of exactly target_size dimensions
    """
    img_rgba = img.convert("RGBA")
    target_w, target_h = target_size

    # Calculate scale factor
    orig_w, orig_h = img_rgba.size
    scale = min(target_w / orig_w, target_h / orig_h)
    new_w = int(orig_w * scale)
    new_h = int(orig_h * scale)

    resized = img_rgba.resize((new_w, new_h), Image.LANCZOS)

    # Center on canvas
    canvas = Image.new("RGBA", (target_w, target_h), background_color)
    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), mask=resized)

    return canvas


def normalize_to_array(img: Image.Image) -> np.ndarray:
    """
    Convert PIL Image to a float32 NumPy array normalized to [0, 1].
    Output shape: (H, W, 4) for RGBA.
    """
    img_rgba = img.convert("RGBA")
    return np.array(img_rgba, dtype=np.float32) / 255.0


def remove_white_background(img: Image.Image, threshold: int = 240) -> Image.Image:
    """
    Set near-white pixels to transparent.
    Useful for isolating garments from white studio backgrounds.

    Args:
        img:       Input PIL Image
        threshold: RGB threshold above which pixels are made transparent (0-255)

    Returns:
        RGBA PIL Image with background removed
    """
    rgba = img.convert("RGBA")
    data = np.array(rgba, dtype=np.uint8)

    r, g, b = data[:, :, 0], data[:, :, 1], data[:, :, 2]
    white_mask = (r > threshold) & (g > threshold) & (b > threshold)
    data[white_mask, 3] = 0  # Transparent

    return Image.fromarray(data, "RGBA")


def preprocess_person(raw_bytes: bytes) -> Image.Image:
    """
    Full preprocessing pipeline for the person/user image.
    - Load → auto-orient (EXIF) → resize with padding → return RGBA
    """
    img = load_image_bytes(raw_bytes)
    img = ImageOps.exif_transpose(img)  # Fix phone camera rotation
    img = resize_with_padding(img, PERSON_TARGET_SIZE)
    logger.debug(f"Person image preprocessed: {img.size}")
    return img


def preprocess_garment(raw_bytes: bytes) -> Image.Image:
    """
    Full preprocessing pipeline for the garment image.
    - Load → remove white background → resize with padding → return RGBA
    """
    img = load_image_bytes(raw_bytes)
    img = remove_white_background(img, threshold=235)
    img = resize_with_padding(img, GARMENT_TARGET_SIZE, background_color=(255, 255, 255, 0))
    logger.debug(f"Garment image preprocessed: {img.size}")
    return img
