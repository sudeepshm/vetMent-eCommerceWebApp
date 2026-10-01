# Architectural Modernization and Engineering Specification for the VÊTEMENT Virtual Try-On Platform

## 1. Executive Summary

Virtual Try-On (VTON) technology serves as a critical capability in modern e-commerce, directly addressing the leading driver of online apparel returns: customer uncertainty regarding garment fit, drape, and aesthetic compatibility. While early virtual try-on software relied upon classical geometric warping and Generative Adversarial Networks (GANs), the emergence of Latent Diffusion Models (LDMs) has elevated image synthesis quality to near-photorealistic fidelity.

Despite these theoretical advancements, academic and student engineering projects attempting to integrate deep generative try-on models into functional e-commerce web applications routinely encounter severe implementation barriers:
1. **Runtime Thread Starvation:** Synchronous HTTP request routes block worker threads for 5–20+ seconds during diffusion inference.
2. **CUDA Out-of-Memory (OOM):** Dual-stream diffusion architectures exceed consumer-tier GPU VRAM ceilings (6GB–8GB).
3. **Multi-Stage Error Compounding:** Legacy Thin-Plate Spline (TPS) warpers yield distorted logos, smudged collars, and flat 2D silhouettes.
4. **Absence of Automated Preprocessing:** Manual clothing masking fails in production; uncalibrated inpainting creates neck ghosting and erased accessories.

This engineering blueprint establishes the modernization plan for **VÊTEMENT (`vetMent-eCommerceWebApp`)**. It transitions the platform from a demo/synchronous setup to a production-grade, asynchronous, parameter-efficient latent diffusion architecture powered by **CatVTON (ICLR 2025)**, automated **SCHP** human parsing, **MediaPipe Pose** anthropometric sizing, and a decoupled **Redis/Celery** task distribution broker.

---

## 2. Diagnostic Analysis of Implementation Bottlenecks

### 2.1 Multi-Stage Error Compounding in Legacy GANs
Traditional pipelines (CP-VTON, ACGPN) execute through isolated, sequential stages:
$$\text{Pose Keypoint Extraction} \longrightarrow \text{Semantic Parsing} \longrightarrow \text{TPS Geometric Warping} \longrightarrow \text{Synthesis GAN}$$
- Boundary segmentation errors in Stage 2 directly skew Stage 3 coordinate interpolation.
- TPS warping cannot model 3D fabric drape, self-occlusion (crossed arms), folds, or fabric thickness.

### 2.2 Synchronous Web Thread Blocking & Request Timeouts
- Coupling GPU inference directly inside HTTP request handlers (e.g. Express or FastAPI without queues) locks the thread pool.
- Gateways and reverse proxies (Nginx, ALB, Cloudflare) trigger HTTP 504 / 503 timeouts after 30–60s idle socket limits.

### 2.3 Hardware Resource Ceilings (CUDA OOM)
- High-resolution diffusion ($768 \times 1024$) on dual-stream networks (TryOnDiffusion, StableVITON, IDM-VTON) consumes 14GB–24GB VRAM.
- Academic consumer hardware (RTX 3060/4060, Colab T4 15GB) requires FP16 casting, attention slicing, and parameter-efficient single-stream spatial concatenation.

### 2.4 The Agnostic Mask Generation Bottleneck
- Inpainting models require an agnostic representation $\mathbf{I}_{\text{agnostic}}$ where the garment is erased while preserving the neck, face, arms, and accessories.
- Manual masking is infeasible; static bounding boxes create collar remnants ("ghosting") or erase hands.

---

## 3. Evaluation of Leading Open-Source VTON Paradigms

```
+----------------------------------------------------------------------------------------------------+
|                                    Evolution of VTON Paradigms                                     |
+----------------------------------------------------------------------------------------------------+
| Phase I (2018–2021) : Multi-stage GANs (CP-VTON, ACGPN)  -> Brittle, Severe Warping Artifacts      |
| Phase II (2022–2023) : Dual-Branch Diffusion (StableVITON) -> High VRAM (~24GB), Slow              |
| Phase III (2024–2025): Concatenation Diffusion (CatVTON)    -> Sub-8GB VRAM, High Fidelity, Fast   |
+----------------------------------------------------------------------------------------------------+
```

### Comparative Operational Matrix

| Metric / Specification | CatVTON (ICLR 2025) | IDM-VTON (ECCV 2024) | OOTDiffusion (CVPR 2024) | Legacy ACGPN / CP-VTON |
|---|---|---|---|---|
| **Model Family** | Latent Diffusion (Single U-Net) | Latent Diffusion (Dual U-Net) | Latent Diffusion (Fusion U-Net) | Multi-Stage GAN + TPS |
| **Conditioning Mode** | Latent Spatial Concatenation | IP-Adapter + GarmentNet | Outfitting Self-Attention | Geometric Affine / Flow |
| **Total Parameters** | ~899 Million | ~1.8 Billion | ~1.5 Billion | ~250 Million |
| **Minimum VRAM (FP16)** | **~6 GB – 8 GB** | ~14 GB – 16 GB | ~10 GB – 12 GB | ~4 GB (Compute bound) |
| **Target Resolution** | $768 \times 1024$ px | $768 \times 1024$ px | $768 \times 1024$ px | $256 \times 192$ px |
| **Average Latency (T4 GPU)** | **4.2 – 6.5 seconds** | 14.0 – 22.0 seconds | 8.5 – 13.0 seconds | 1.2 – 2.5 seconds |
| **Fine Text & Logo Fidelity** | High (Direct Alignment) | Exceptional | Moderate to High | Low (Severe Smearing) |
| **Academic Feasibility** | **Highest (Consumer / Colab T4)** | High (Requires Cloud GPU) | High (Moderate Resource) | Deprecated |

### Why CatVTON is Selected for VÊTEMENT
CatVTON eliminates dedicated cross-attention garment encoders. The garment image, target person image, and binary agnostic mask are concatenated along the spatial and channel dimensions:
$$\mathbf{Z}_{\text{input}} = \left[ \mathcal{E}(\mathbf{I}_{\text{person}}), \, \mathcal{E}(\mathbf{I}_{\text{garment}}), \, \mathcal{R}(\mathbf{M}_{\text{agnostic}}) \right]$$
This requires only a single denoising U-Net (899M parameters), running comfortably under 8GB VRAM with sub-6s generation times.

---

## 4. Decoupled System Architecture Blueprint

```
+----------------------------------------------------------------------------------------------------+
|                                    vetMent System Architecture                                     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    [ Web Frontend ]  <========= HTTP / REST / Status Polling ========>  [ API Gateway & Backend ]  |
|   (Next.js 14 / React)                                                    (Node.js / Express)      |
|           │                                                                         │              |
|           │ 1. Direct Upload                                                        │ 2. Enqueue   |
|           ▼                                                                         ▼              |
|   [ Object Storage ] <─────────────────────────────────────────────────────── [ Redis Broker ]     |
| (Cloudinary / S3 / MinIO)                                                       (Task Queue & State)|
|           ▲                                                                         │              |
|           │                                                                         │ 3. Dequeue   |
|           │ 4. Read Assets & Write Result                                           ▼              |
|           +────────────────────────────────────────────────────────── [ AI Inference Worker ]     |
|                                                                      (FastAPI + CatVTON / Colab)   |
+----------------------------------------------------------------------------------------------------+
```

### Operational State Machine
```
[QUEUED] ──► [PREPROCESSING] ──► [INFERENCE] ──► [POSTPROCESSING] ──► [COMPLETED]
                                         │
                                         └──► [FAILED]
```

---

## 5. Automated Agnostic Preprocessing Pipeline

```
+----------------------------------------------------------------------------------------------------+
|                                     Automated Preprocessing Flow                                   |
+----------------------------------------------------------------------------------------------------+
|  [ User Image ] ──► [ Semantic Parser (SCHP) ] ──► [ Class 3: Upper Clothing Mask M_cloth ]        |
|          │                                                          │                              |
|          ▼                                                          ▼                              |
|  [ Pose Estimation ]                                        [ Elliptical Dilation (K_r) ]          |
|  (MediaPipe 33 pts)                                                 │                              |
|          │                                                          ▼                              |
|          │                                                  [ Subtract Face, Neck, Hands ]         |
|          │                                                          │                              |
|          ▼                                                          ▼                              |
|  [ Skeletal Prior Graph ]                                   [ Agnostic Mask M_agnostic ]           |
|          │                                                          │                              |
|          └──────────────────────────┬───────────────────────────────┘                              |
|                                     ▼                                                              |
|                     [ Person-Agnostic Image I_agnostic ]                                           |
+----------------------------------------------------------------------------------------------------+
```

### Mathematical Formulation
1. **Semantic Category Parsing (LIP Dataset):**
   - $\mathcal{C}_0$: Background, $\mathcal{C}_1$: Face & Neck, $\mathcal{C}_2$: Hair, $\mathcal{C}_3$: Upper Clothes, $\mathcal{C}_4$: Lower Clothes, $\mathcal{C}_5$: Arms, $\mathcal{C}_6$: Hands.
2. **Morphological Dilation:**
   $$\mathbf{M}_{\text{dilated}} = \mathbf{M}_{\text{cloth}} \oplus \mathbf{K}_r, \quad \text{where } r = 15 \text{ px}$$
3. **Agnostic Mask Generation:**
   $$\mathbf{M}_{\text{agnostic}} = \mathbf{M}_{\text{dilated}} \setminus \left( \mathbf{M}_{\text{face}} \cup \mathbf{M}_{\text{hair}} \cup \mathbf{M}_{\text{hands}} \right)$$

---

## 6. Anthropometric Keypoint Sizing Engine

### 6.1 Projective Scale Calibration
Using reported physical height $H_{\text{true}}$ (in cm) and MediaPipe anatomical landmark bounds:
$$y_{\text{crown}} = y_{\text{nose}} - 0.618 \cdot \vert{}y_{\text{ear}} - y_{\text{nose}}\vert{}$$
$$y_{\text{base}} = \frac{y_{\text{left\_heel}} + y_{\text{right\_heel}}}{2}$$
$$\Lambda_{\text{height}} = (y_{\text{base}} - y_{\text{crown}}) \times H_{\text{image}}$$
$$\kappa = \frac{H_{\text{true}}}{\Lambda_{\text{height}}} \quad [\text{cm/px}]$$

### 6.2 Body Measurement Extraction
- **Bi-Acromial Shoulder Breadth ($D_{\text{shoulder}}$):**
  $$D_{\text{shoulder}} = \kappa \cdot \sqrt{(x_{12} - x_{11})^2 W^2 + (y_{12} - y_{11})^2 H^2} \cdot \gamma_{\text{deltoid}}$$
  where $\gamma_{\text{deltoid}} \approx 1.05$.
- **Torso Vertical Length ($L_{\text{torso}}$):**
  $$P_{\text{shoulder\_mid}} = \frac{P_{11} + P_{12}}{2}, \quad P_{\text{hip\_mid}} = \frac{P_{23} + P_{24}}{2}$$
  $$L_{\text{torso}} = \kappa \cdot \Vert{}P_{\text{shoulder\_mid}} - P_{\text{hip\_mid}}\Vert{}_2$$
- **Bi-Trochanteric Hip Breadth ($D_{\text{hip}}$):**
  $$D_{\text{hip}} = \kappa \cdot \sqrt{(x_{24} - x_{23})^2 W^2 + (y_{24} - y_{23})^2 H^2}$$

### 6.3 Probabilistic MAP Size Recommendation
$$\mathcal{P}(\text{Size} = k \mid \mathbf{m}) = \frac{1}{(2\pi)^{d/2} \vert{}\mathbf{\Sigma}_k\vert{}^{1/2}} \exp\left(-\frac{1}{2} (\mathbf{m} - \mathbf{\mu}_k)^T \mathbf{\Sigma}_k^{-1} (\mathbf{m} - \mathbf{\mu}_k)\right)$$
$$k^* = \arg\max_k \mathcal{P}(\text{Size} = k \mid \mathbf{m}), \quad k \in \{S, M, L, XL, XXL\}$$

---

## 7. RESTful API Specification

### 1. Submit Virtual Try-On Job
- **Endpoint:** `POST /api/v1/try-on/submit`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "user_image_url": "https://res.cloudinary.com/.../user_portrait.jpg",
  "garment_id": "65b98...",
  "garment_image_url": "https://res.cloudinary.com/.../garment_cutout.png",
  "category": "upper_body",
  "options": {
    "num_inference_steps": 25,
    "user_height_cm": 176
  }
}
```
- **Response (HTTP 202 Accepted):**
```json
{
  "status": "QUEUED",
  "job_id": "vton_8a1f7e34-c21d-409b-98f2-31b6e4d101a8",
  "estimated_wait_seconds": 5.5,
  "status_endpoint": "/api/v1/try-on/status/vton_8a1f7e34-c21d-409b-98f2-31b6e4d101a8"
}
```

### 2. Poll Job Status
- **Endpoint:** `GET /api/v1/try-on/status/{job_id}`
- **Response (HTTP 200 OK - Processing):**
```json
{
  "job_id": "vton_8a1f7e34-c21d-409b-98f2-31b6e4d101a8",
  "status": "PROCESSING",
  "current_stage": "INFERENCE",
  "progress_percentage": 65,
  "elapsed_seconds": 3.6
}
```
- **Response (HTTP 200 OK - Completed):**
```json
{
  "job_id": "vton_8a1f7e34-c21d-409b-98f2-31b6e4d101a8",
  "status": "COMPLETED",
  "result_image_url": "https://res.cloudinary.com/.../vton_result.jpg",
  "sizing_advisory": {
    "recommended_size": "M",
    "calculated_shoulder_cm": 43.8,
    "confidence_score": 0.92,
    "fit_description": "True to size across chest and shoulders"
  },
  "telemetry": {
    "preprocessing_ms": 380,
    "inference_ms": 4720,
    "postprocessing_ms": 90,
    "total_latency_ms": 5190
  }
}
```

---

## 8. Empirical Evaluation & Academic Milestones

### Quantitative Benchmarking Metrics
- **Fréchet Inception Distance (FID):** Perceptual realism relative to real dataset distributions.
- **Structural Similarity Index (SSIM):** Preservation of non-garment areas (face, neck, hands, lower body).
- **LPIPS:** Patch-level perceptual loss across deep VGG layers.
- **System Usability Scale (SUS):** 10-question standardized survey targeting $\ge 75/100$ score.

### 5-Phase Implementation Roadmap
1. **Phase 1: Model Setup & Worker:** CatVTON FP16 inference worker on FastAPI with Colab/GPU tunnel support.
2. **Phase 2: Automated Preprocessing:** SCHP segmentation and dynamic anatomical mask dilation module.
3. **Phase 3: Asynchronous Pipeline:** Redis task queue, state machine, and status polling endpoints.
4. **Phase 4: Full-Stack E-Commerce Integration:** Split-screen slider, MediaPipe pose sizing engine, interactive dressing room.
5. **Phase 5: Benchmarking & Defense Artifacts:** Evaluation scripts (FID/SSIM), SUS survey, presentation slides.
