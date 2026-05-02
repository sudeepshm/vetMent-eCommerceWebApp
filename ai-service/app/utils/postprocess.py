"""
postprocess.py

Post-processing utilities for the AI try-on result image.
Handles color correction, sharpening, compression, and
format conversion before returning results to the client.
"""

import io
import logging
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import numpy as np

logger = logging.getLogger("ai-service.utils.postprocess")


def enhance_result(img: Image.Image) -> Image.Image:
    """
    Apply subtle post-processing to make the composite look more natural.
    
    Pipeline:
    1. Slight sharpening to restore detail lost during compositing
    2. Subtle contrast boost for richness
    3. Gentle brightness correction
    """
    # 1. Sharpen
    img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=80, threshold=3))

    # 2. Contrast boost
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.05)

    # 3. Brightness
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(1.02)

    return img


def add_watermark(img: Image.Image, text: str = "VÊTEMENT AI Try-On") -> Image.Image:
    """
    Add a subtle watermark to the bottom-right of the result image.
    Optional — only called in production mode.
    """
    img_copy = img.copy().convert("RGBA")
    width, height = img_copy.size

    # Create transparent overlay for watermark
    overlay = Image.new("RGBA", img_copy.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    # Draw text (small, semi-transparent)
    text_x = width - 200
    text_y = height - 24
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 100))

    return Image.alpha_composite(img_copy, overlay).convert("RGB")


def compress_to_bytes(
    img: Image.Image,
    fmt: str = "JPEG",
    quality: int = 88,
    max_dimension: int = 1024,
) -> bytes:
    """
    Resize if too large, then compress to bytes for upload or return.

    Args:
        img:           PIL Image
        fmt:           Output format ('JPEG' or 'PNG')
        quality:       JPEG quality (1-95)
        max_dimension: Maximum width or height in pixels

    Returns:
        Compressed image bytes
    """
    img_rgb = img.convert("RGB")

    # Downscale if needed
    w, h = img_rgb.size
    if max(w, h) > max_dimension:
        scale = max_dimension / max(w, h)
        img_rgb = img_rgb.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        logger.debug(f"Downscaled result from {w}x{h} to {img_rgb.size}")

    buffer = io.BytesIO()
    save_kwargs: dict = {"format": fmt, "optimize": True}
    if fmt == "JPEG":
        save_kwargs["quality"] = quality
        save_kwargs["progressive"] = True

    img_rgb.save(buffer, **save_kwargs)
    result = buffer.getvalue()
    logger.debug(f"Compressed to {len(result) / 1024:.1f} KB ({fmt})")
    return result


def postprocess_result(img: Image.Image, add_wm: bool = False) -> bytes:
    """
    Full post-processing pipeline for the try-on result.

    Args:
        img:    The composited result PIL Image
        add_wm: Whether to add the VÊTEMENT watermark

    Returns:
        Final JPEG bytes ready for upload or return
    """
    img = img.convert("RGBA")

    # Enhance
    enhanced = enhance_result(img.convert("RGB"))

    # Optionally watermark
    if add_wm:
        enhanced = add_watermark(enhanced)

    # Compress
    return compress_to_bytes(enhanced, fmt="JPEG", quality=88)
