"""
model_runner.py

Virtual try-on generation service — Strategy pattern.

Backends:
  - PILDemoBackend         : Fast PIL compositing (default, no GPU, low quality)
  - HuggingFaceSpaceBackend: Real IDM-VTON via HuggingFace Spaces API (FREE, high quality)
  - OOTDiffusionBackend    : Stub for future local GPU inference

Switch backend via TRYON_BACKEND env var:
  demo     → PILDemoBackend (default)
  hf_space → HuggingFaceSpaceBackend (RECOMMENDED — real AI, free)
  ootd     → OOTDiffusionBackend (stub)
"""

import io
import os
import logging
import tempfile
from typing import Protocol, runtime_checkable

from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

from app.services.image_processing import (
    normalize_image,
    extract_garment_region,
    to_numpy,
    image_to_bytes,
)

logger = logging.getLogger("ai-service.model_runner")

PERSON_SIZE = (512, 768)
GARMENT_SCALE = 0.55


# ── Backend Protocol ───────────────────────────────────────────────────────────
@runtime_checkable
class TryOnBackend(Protocol):
    """Interface every try-on backend must implement."""

    def run(self, person_bytes: bytes, garment_bytes: bytes) -> bytes:
        """
        Generate a virtual try-on image.

        Args:
            person_bytes:  Raw bytes of the user's photo
            garment_bytes: Raw bytes of the garment image

        Returns:
            JPEG bytes of the result image
        """
        ...


# ── Backend 1: PIL Demo (default) ──────────────────────────────────────────────
def _detect_torso_region(person_np: np.ndarray) -> tuple:
    h, w = person_np.shape[:2]
    return int(w * 0.20), int(h * 0.22), int(w * 0.60), int(h * 0.42)


def _apply_garment_to_person(
    person_img: Image.Image,
    garment_img: Image.Image,
    opacity: float = 0.88,
) -> Image.Image:
    person = normalize_image(person_img, PERSON_SIZE)
    garment = normalize_image(garment_img, PERSON_SIZE)

    garment_rgba = extract_garment_region(garment)
    person_np = to_numpy(person)
    x, y, gw, gh = _detect_torso_region(person_np)

    garment_resized = garment_rgba.resize((gw, gh), Image.LANCZOS)
    enhancer = ImageEnhance.Brightness(garment_resized)
    garment_resized = enhancer.enhance(0.92)
    garment_blurred = garment_resized.filter(ImageFilter.SMOOTH_MORE)

    r, g, b, a = garment_blurred.split()
    a = a.point(lambda v: int(v * opacity))
    garment_final = Image.merge("RGBA", (r, g, b, a))

    result = person.convert("RGBA")
    result.paste(garment_final, (x, y), mask=garment_final)
    return result.convert("RGB")


class PILDemoBackend:
    """Fast PIL compositing — no GPU, low quality, instant."""

    def run(self, person_bytes: bytes, garment_bytes: bytes) -> bytes:
        logger.info("PILDemoBackend: compositing")
        person_img = Image.open(io.BytesIO(person_bytes)).convert("RGBA")
        garment_img = Image.open(io.BytesIO(garment_bytes)).convert("RGBA")
        result = _apply_garment_to_person(person_img, garment_img)
        out = image_to_bytes(result, fmt="JPEG", quality=90)
        logger.info(f"PILDemoBackend: done ({len(out)} bytes)")
        return out


# ── Backend 2: HuggingFace Spaces — IDM-VTON (FREE, production quality) ───────
class HuggingFaceSpaceBackend:
    """
    Calls the IDM-VTON model running on HuggingFace Spaces.
    
    Space: yisol/IDM-VTON  (https://huggingface.co/spaces/yisol/IDM-VTON)
    Cost:  FREE — HuggingFace pays for the GPU
    
    Quality: ⭐⭐⭐⭐⭐ — real diffusion-based virtual try-on
    Latency: 30–90 seconds (depends on HF queue length)

    Optional: set HF_TOKEN in .env for higher rate limits and priority
    """

    # Primary and fallback spaces — same model, different instances
    SPACES = [
        "yisol/IDM-VTON",
        "Nymbo/Virtual-Try-On",   # community mirror, often less queue
    ]

    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN") or None

    def run(self, person_bytes: bytes, garment_bytes: bytes) -> bytes:
        from gradio_client import Client, handle_file

        person_tmp = None
        garment_tmp = None

        try:
            # Write bytes to temp files (gradio_client requires file paths)
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
                f.write(person_bytes)
                person_tmp = f.name

            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
                f.write(garment_bytes)
                garment_tmp = f.name

            # Try each space in order until one succeeds
            last_error = None
            for space_id in self.SPACES:
                try:
                    result_bytes = self._call_space(
                        space_id, person_tmp, garment_tmp
                    )
                    logger.info(
                        f"HuggingFaceSpaceBackend: done via {space_id} "
                        f"({len(result_bytes)} bytes)"
                    )
                    return result_bytes
                except Exception as e:
                    logger.warning(f"Space {space_id} failed: {e}")
                    last_error = e
                    continue

            raise RuntimeError(
                f"All HuggingFace spaces failed. Last error: {last_error}\n"
                "The space may be sleeping (retry in 60s) or the queue is full."
            )

        finally:
            # Always clean up temp files
            for path in [person_tmp, garment_tmp]:
                if path:
                    try:
                        os.unlink(path)
                    except OSError:
                        pass

    def _call_space(
        self, space_id: str, person_path: str, garment_path: str
    ) -> bytes:
        from gradio_client import Client, handle_file

        logger.info(f"HuggingFaceSpaceBackend: connecting to {space_id}...")
        
        kwargs = {}
        if self.hf_token:
            kwargs["hf_token"] = self.hf_token

        client = Client(space_id, **kwargs)

        logger.info(f"HuggingFaceSpaceBackend: sending to {space_id} (may take 30–90s)")

        result = client.predict(
            dict={"background": handle_file(person_path), "layers": [], "composite": None},
            garm_img=handle_file(garment_path),
            garment_des="upper body clothing",
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon",
        )

        # result is a tuple: (output_image_path, masked_image_path)
        output_path = result[0] if isinstance(result, (list, tuple)) else result

        # Read result image as bytes
        with open(output_path, "rb") as f:
            result_bytes = f.read()

        # Validate it's a real image
        Image.open(io.BytesIO(result_bytes)).verify()

        return result_bytes


# ── Backend 3: OOTDiffusion stub (local GPU) ───────────────────────────────────
class OOTDiffusionBackend:
    """
    Stub for self-hosted OOTDiffusion / IDM-VTON on local GPU.
    Requires NVIDIA GPU with 12GB+ VRAM + model weights.
    """

    def run(self, person_bytes: bytes, garment_bytes: bytes) -> bytes:
        logger.warning("OOTDiffusionBackend: not configured")
        raise RuntimeError(
            "OOTDiffusion backend requires a local GPU with 12GB+ VRAM. "
            "Use TRYON_BACKEND=hf_space for free cloud inference."
        )


# ── Factory ────────────────────────────────────────────────────────────────────
def get_backend() -> TryOnBackend:
    """
    Return the active backend based on TRYON_BACKEND env var.

    Values:
      demo     → PILDemoBackend     (default — fast but low quality)
      hf_space → HuggingFaceSpaceBackend (FREE real IDM-VTON — RECOMMENDED)
      ootd     → OOTDiffusionBackend     (stub — requires local GPU)
    """
    backend_name = os.getenv("TRYON_BACKEND", "demo").lower().strip()

    if backend_name == "hf_space":
        logger.info("Using HuggingFaceSpaceBackend (IDM-VTON)")
        return HuggingFaceSpaceBackend()

    if backend_name == "ootd":
        logger.info("Using OOTDiffusionBackend")
        return OOTDiffusionBackend()

    logger.info("Using PILDemoBackend (default)")
    return PILDemoBackend()


# ── Public entry point ─────────────────────────────────────────────────────────
def run_tryon_model(person_bytes: bytes, garment_bytes: bytes) -> bytes:
    """
    Main entry point. Delegates to backend selected by TRYON_BACKEND env var.
    """
    backend = get_backend()
    try:
        return backend.run(person_bytes, garment_bytes)
    except RuntimeError:
        raise
    except Exception as e:
        logger.error(f"Try-on generation failed: {e}")
        raise RuntimeError(f"Model runner error: {e}") from e
