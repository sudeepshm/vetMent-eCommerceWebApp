import io
import logging
from PIL import Image
import numpy as np

logger = logging.getLogger("ai-service.image_processing")

TARGET_SIZE = (768, 1024)  # (width, height) — standard try-on resolution


def load_image_from_bytes(data: bytes) -> Image.Image:
    """Load a PIL Image from raw bytes."""
    return Image.open(io.BytesIO(data)).convert("RGBA")


def normalize_image(img: Image.Image, size: tuple = TARGET_SIZE) -> Image.Image:
    """
    Resize and normalize an image to the target dimensions
    while preserving aspect ratio with centered padding.
    """
    img_rgb = img.convert("RGB")
    target_w, target_h = size

    # Calculate resize dimensions preserving aspect ratio
    orig_w, orig_h = img_rgb.size
    ratio = min(target_w / orig_w, target_h / orig_h)
    new_w = int(orig_w * ratio)
    new_h = int(orig_h * ratio)

    resized = img_rgb.resize((new_w, new_h), Image.LANCZOS)

    # Create white canvas and paste centered
    canvas = Image.new("RGB", (target_w, target_h), (255, 255, 255))
    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y))

    return canvas


def to_numpy(img: Image.Image) -> np.ndarray:
    """Convert PIL Image to normalized float32 numpy array [0, 1]."""
    return np.array(img).astype(np.float32) / 255.0


def from_numpy(arr: np.ndarray) -> Image.Image:
    """Convert numpy array back to uint8 PIL Image."""
    clipped = np.clip(arr * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(clipped)


def image_to_bytes(img: Image.Image, fmt: str = "JPEG", quality: int = 92) -> bytes:
    """Serialize PIL Image to bytes."""
    buffer = io.BytesIO()
    img_rgb = img.convert("RGB")
    img_rgb.save(buffer, format=fmt, quality=quality, optimize=True)
    return buffer.getvalue()


def extract_garment_region(garment_img: Image.Image) -> Image.Image:
    """
    Simple garment isolation: remove near-white backgrounds.
    In a real model this would be a segmentation mask.
    """
    rgba = garment_img.convert("RGBA")
    data = np.array(rgba, dtype=np.float32)

    # Pixels where R, G, B are all > 240 → make transparent
    white_mask = (data[:, :, 0] > 240) & (data[:, :, 1] > 240) & (data[:, :, 2] > 240)
    data[white_mask, 3] = 0  # Set alpha to 0 (transparent)

    return Image.fromarray(data.astype(np.uint8), "RGBA")
