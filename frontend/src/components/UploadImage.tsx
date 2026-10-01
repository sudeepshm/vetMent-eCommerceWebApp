"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import {
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Sliders,
  Ruler,
  Cpu,
  Layers,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react"
import { submitTryOnJob, getTryOnJobStatus } from "@/lib/api"
import { useTryOnStore } from "@/store/tryOnStore"
import { clsx } from "clsx"
import type { TryOnRecord } from "@/types"

export interface UploadImageProps {
  productId?: string
  garmentImageUrl?: string
  productName?: string
}

// ── Client-side 3:4 aspect ratio normalisation ──
async function normaliseImage(file: File, targetW = 768, targetH = 1024): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement("canvas")
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(file)
        return
      }

      // Fill with neutral white background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, targetW, targetH)

      // Fit image centered within 3:4 canvas
      const scale = Math.min(targetW / img.width, targetH / img.height)
      const x = (targetW - img.width * scale) / 2
      const y = (targetH - img.height * scale) / 2
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file)
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }))
        },
        "image/jpeg",
        0.92
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

export default function UploadImage({
  productId = "",
  garmentImageUrl = "",
  productName = "this garment",
}: UploadImageProps) {
  const {
    userImagePreview,
    userImageFile,
    result,
    status,
    error,
    jobId,
    progressPercentage,
    currentStage,
    sizingAdvisory,
    userHeightCm,
    setUserImage,
    setStatus,
    setResult,
    setError,
    setJobId,
    setProgress,
    setUserHeightCm,
    reset,
  } = useTryOnStore()

  const [isDragOver, setIsDragOver] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)
  const [viewMode, setViewMode] = useState<"slider" | "sideBySide">("slider")
  const sliderContainerRef = useRef<HTMLDivElement>(null)

  const MAX_SIZE = 15 * 1024 * 1024
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"]

  const processFile = (selected: File) => {
    if (!ALLOWED.includes(selected.type)) {
      setError("Only JPG, PNG, and WebP images are allowed.")
      return
    }
    if (selected.size > MAX_SIZE) {
      setError("Image must be under 15 MB.")
      return
    }
    const preview = URL.createObjectURL(selected)
    setUserImage(selected, preview)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  // ── Asynchronous Virtual Try-On Execution with Polling ──
  const handleUpload = async () => {
    if (!userImageFile) return
    if (!productId || !garmentImageUrl) {
      setError("Please select a garment before trying on.")
      return
    }

    try {
      setStatus("processing")
      setProgress(10, "PREPROCESSING")

      // 1. Client-side aspect framing
      const normalisedFile = await normaliseImage(userImageFile)

      // 2. Submit task to asynchronous task broker
      const submitRes = await submitTryOnJob({
        userImage: normalisedFile,
        productId,
        garmentImageUrl,
        user_height_cm: userHeightCm,
      })

      setJobId(submitRes.job_id)
      setProgress(20, "QUEUED")

      // 3. Poll status endpoint every 1.5 seconds
      const pollInterval = setInterval(async () => {
        try {
          const job = await getTryOnJobStatus(submitRes.job_id)

          if (job.status === "PROCESSING" || job.status === "QUEUED") {
            setProgress(job.progress_percentage || 45, job.current_stage)
          } else if (job.status === "COMPLETED" && job.result_image_url) {
            clearInterval(pollInterval)
            const completedRecord: TryOnRecord = {
              _id: job.job_id,
              user: "",
              product: { _id: productId } as any,
              userImageUrl: userImagePreview || "",
              resultImageUrl: job.result_image_url,
              sizingAdvisory: job.sizing_advisory || null,
              telemetry: job.telemetry || null,
              createdAt: new Date().toISOString(),
            }
            setResult(completedRecord)
          } else if (job.status === "FAILED") {
            clearInterval(pollInterval)
            setError(job.error || "Inference failed on the GPU worker.")
          }
        } catch {
          // Keep polling if transient network hiccup
        }
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate virtual try-on."
      setError(msg)
    }
  }

  // ── Split-Screen Comparison Slider Drag Handlers ──
  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!sliderContainerRef.current) return
      const rect = sliderContainerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setSliderPosition(percent)
    },
    [sliderContainerRef]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDraggingSlider) return
      handleSliderMove(e.touches[0].clientX)
    },
    [isDraggingSlider, handleSliderMove]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingSlider) return
      handleSliderMove(e.clientX)
    },
    [isDraggingSlider, handleSliderMove]
  )

  const handleMouseUp = useCallback(() => {
    setIsDraggingSlider(false)
  }, [])

  useEffect(() => {
    if (isDraggingSlider) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("touchmove", handleTouchMove)
      window.addEventListener("touchend", handleMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleMouseUp)
    }
  }, [isDraggingSlider, handleMouseMove, handleMouseUp, handleTouchMove])

  return (
    <div className="w-full space-y-6">
      {/* ── State 1: Drop Zone (idle) ── */}
      {status === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={clsx(
            "relative flex flex-col items-center justify-center rounded-none border-2 border-dashed p-10 text-center transition-all duration-200",
            isDragOver ? "border-black bg-neutral-50" : "border-neutral-300 bg-white hover:border-neutral-400"
          )}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
            <Upload className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="text-base font-medium text-black">Upload your portrait photo</p>
          <p className="mt-1 max-w-xs text-xs text-neutral-500">
            Full-body or half-body portrait with good lighting. Stand facing forward for optimal drape synthesis.
          </p>
          <label className="btn-primary mt-6 cursor-pointer text-xs uppercase tracking-wider">
            Select Photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      )}

      {/* ── State 2: Selected Photo & Calibration Form ── */}
      {(status === "selected" || status === "error") && userImagePreview && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-none border border-neutral-200">
            <div className="relative aspect-[3/4] w-full bg-neutral-100">
              <Image src={userImagePreview} alt="User portrait" fill className="object-cover" />
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
                3:4 Standardized Frame
              </div>
            </div>
            <button
              onClick={reset}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-black/75 text-white transition hover:bg-black"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Anthropometric Height Calibration Input */}
          <div className="rounded-none border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-700">
                <Ruler className="h-3.5 w-3.5 text-neutral-500" />
                Your Height (for Sizing Advisory)
              </label>
              <span className="font-mono text-xs font-bold text-black">{userHeightCm} cm</span>
            </div>
            <input
              type="range"
              min={140}
              max={210}
              value={userHeightCm}
              onChange={(e) => setUserHeightCm(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-300 accent-black"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Calibrates metric pixel scaling ($\kappa = H / \Lambda$) for shoulder and torso sizing.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button onClick={handleUpload} className="btn-primary w-full py-3.5 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="mr-2 h-4 w-4 inline" />
            Try On {productName}
          </button>
          <button onClick={reset} className="btn-ghost w-full text-xs text-neutral-500">
            Choose different photo
          </button>
        </div>
      )}

      {/* ── State 3: Asynchronous Multi-Stage Progress Loader ── */}
      {status === "processing" && (
        <div className="space-y-6 rounded-none border border-neutral-200 bg-white p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-black" strokeWidth={1.5} />
              <Cpu className="absolute h-5 w-5 text-neutral-400" />
            </div>
            <h4 className="text-base font-semibold text-black">CatVTON Generative Try-On</h4>
            <p className="mt-1 text-xs text-neutral-500">
              Asynchronous diffusion inference decoupled via Redis queue
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-600">
              <span className="font-semibold uppercase tracking-wider text-black">Stage: {currentStage}</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden bg-neutral-100">
              <div
                className="h-full bg-black transition-all duration-500 ease-out"
                style={{ width: `${Math.max(15, progressPercentage)}%` }}
              />
            </div>
          </div>

          {/* Stage Progression Stepper */}
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-wider text-neutral-400">
            <div className={clsx(progressPercentage >= 15 && "font-semibold text-black")}>
              1. Enqueued
            </div>
            <div className={clsx(progressPercentage >= 35 && "font-semibold text-black")}>
              2. Masking
            </div>
            <div className={clsx(progressPercentage >= 65 && "font-semibold text-black")}>
              3. Diffusion
            </div>
            <div className={clsx(progressPercentage >= 95 && "font-semibold text-black")}>
              4. Complete
            </div>
          </div>
        </div>
      )}

      {/* ── State 4: Completed Result with Split-Screen Comparison & Sizing ── */}
      {status === "done" && result && (
        <div className="space-y-5">
          {/* Success Banner */}
          <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              Virtual Try-On Rendered Successfully
            </div>
            {/* View Mode Toggle */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("slider")}
                className={clsx(
                  "px-2 py-1 text-[11px] font-semibold transition",
                  viewMode === "slider" ? "bg-emerald-800 text-white" : "text-emerald-800 hover:bg-emerald-100"
                )}
              >
                Split-Slider
              </button>
              <button
                onClick={() => setViewMode("sideBySide")}
                className={clsx(
                  "px-2 py-1 text-[11px] font-semibold transition",
                  viewMode === "sideBySide" ? "bg-emerald-800 text-white" : "text-emerald-800 hover:bg-emerald-100"
                )}
              >
                Side-by-Side
              </button>
            </div>
          </div>

          {/* Mode A: Interactive Split-Screen Comparison Slider */}
          {viewMode === "slider" && (
            <div
              ref={sliderContainerRef}
              onMouseDown={() => setIsDraggingSlider(true)}
              onTouchStart={() => setIsDraggingSlider(true)}
              className="relative aspect-[3/4] w-full cursor-ew-resize select-none overflow-hidden border border-neutral-200 bg-neutral-100"
            >
              {/* After Image (Try-on result) */}
              <Image
                src={result.resultImageUrl}
                alt="Try-on synthesized result"
                fill
                className="object-cover"
                priority
              />

              {/* Before Image (Original user photo), clipped by slider position */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                {userImagePreview && (
                  <Image
                    src={userImagePreview}
                    alt="Original photo"
                    fill
                    className="object-cover"
                    priority
                  />
                )}
                {/* Before Label */}
                <div className="absolute left-3 top-3 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                  Before (Original)
                </div>
              </div>

              {/* After Label */}
              <div className="absolute right-3 top-3 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                After (Try-On)
              </div>

              {/* Draggable Divider Line & Knob */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-neutral-800" />
                </div>
              </div>
            </div>
          )}

          {/* Mode B: Side-by-Side Comparison */}
          {viewMode === "sideBySide" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Original
                </p>
                <div className="relative aspect-[3/4] overflow-hidden border border-neutral-200">
                  {userImagePreview && (
                    <Image src={userImagePreview} alt="Original" fill className="object-cover" />
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  With Outfit
                </p>
                <div className="relative aspect-[3/4] overflow-hidden border border-neutral-200">
                  <Image src={result.resultImageUrl} alt="Try-on" fill className="object-cover" />
                </div>
              </div>
            </div>
          )}

          {/* ── Anthropometric Sizing Advisory Card ── */}
          {result.sizingAdvisory && (
            <div className="rounded-none border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-black" />
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    Anthropometric Size Advisory
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-neutral-500">Recommended:</span>
                  <span className="rounded bg-black px-2 py-0.5 font-mono text-xs font-bold text-white">
                    Size {result.sizingAdvisory.recommended_size}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-700 italic">
                &ldquo;{result.sizingAdvisory.fit_description}&rdquo;
              </p>

              {result.sizingAdvisory.measurements && (
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] border-t border-neutral-200 pt-2.5">
                  <div className="rounded bg-white p-1.5 border border-neutral-200">
                    <p className="text-[10px] uppercase text-neutral-400">Shoulder</p>
                    <p className="font-mono font-bold text-neutral-800">
                      {result.sizingAdvisory.measurements.shoulder_breadth_cm} cm
                    </p>
                  </div>
                  <div className="rounded bg-white p-1.5 border border-neutral-200">
                    <p className="text-[10px] uppercase text-neutral-400">Torso</p>
                    <p className="font-mono font-bold text-neutral-800">
                      {result.sizingAdvisory.measurements.torso_length_cm} cm
                    </p>
                  </div>
                  <div className="rounded bg-white p-1.5 border border-neutral-200">
                    <p className="text-[10px] uppercase text-neutral-400">Confidence</p>
                    <p className="font-mono font-bold text-emerald-700">
                      {Math.round(result.sizingAdvisory.confidence_score * 100)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <a
              href={result.resultImageUrl}
              download="vetment-tryon.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider"
            >
              <Download className="mr-2 h-4 w-4 inline" />
              Download High-Res
            </a>
            <button onClick={reset} className="btn-ghost flex-1 py-3 text-xs text-neutral-600">
              Try Another Outfit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
