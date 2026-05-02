"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { Upload, X, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react"
import { submitTryOn } from "@/lib/api"
import type { TryOnRecord } from "@/types"
import { clsx } from "clsx"

export interface UploadImageProps {
  productId?: string
  garmentImageUrl?: string
  productName?: string
}

type UploadStep = "idle" | "selected" | "processing" | "done" | "error"

export default function UploadImage({
  productId = "",
  garmentImageUrl = "",
  productName = "this item",
}: UploadImageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [step, setStep] = useState<UploadStep>("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TryOnRecord | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const MAX_SIZE = 10 * 1024 * 1024
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"]

  const processFile = (selected: File) => {
    if (!ALLOWED.includes(selected.type)) {
      setError("Only JPG, PNG, and WebP images are allowed.")
      return
    }
    if (selected.size > MAX_SIZE) {
      setError("Image must be under 10 MB.")
      return
    }
    setError(null)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setStep("selected")
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

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setStep("idle")
    setError(null)
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return
    if (!productId || !garmentImageUrl) {
      setError("Please select a product before trying on.")
      return
    }

    try {
      setStep("processing")
      setError(null)
      const tryOn = await submitTryOn({ userImage: file, productId, garmentImageUrl })
      setResult(tryOn)
      setStep("done")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Processing failed."
      setError(msg)
      setStep("error")
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Drop Zone */}
      {step === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={clsx(
            "relative flex flex-col items-center justify-center rounded-none border-2 border-dashed p-12 text-center transition-all duration-200",
            isDragOver
              ? "border-black bg-neutral-50"
              : "border-neutral-300 bg-white hover:border-neutral-400"
          )}
        >
          <Upload
            className={clsx(
              "mb-4 h-10 w-10 transition-colors",
              isDragOver ? "text-black" : "text-neutral-400"
            )}
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-black">Drop your photo here</p>
          <p className="mt-1 text-xs text-neutral-500">
            or click to browse — JPG, PNG, WebP up to 10 MB
          </p>
          <label className="btn-primary mt-6 cursor-pointer">
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

      {/* Preview + Actions */}
      {(step === "selected" || step === "error") && preview && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-none border border-neutral-200">
            <div className="relative aspect-[3/4] w-full">
              <Image src={preview} alt="Your photo preview" fill className="object-cover" />
            </div>
            <button
              onClick={handleReset}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-black/70 text-white transition hover:bg-black"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button onClick={handleUpload} className="btn-primary w-full">
            Generate Try‑On for {productName}
          </button>
          <button onClick={handleReset} className="btn-ghost w-full text-neutral-500">
            Choose different photo
          </button>
        </div>
      )}

      {/* Processing */}
      {step === "processing" && (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-none border border-neutral-200 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-black" strokeWidth={1.5} />
          <p className="text-sm font-medium text-black">AI is processing your image…</p>
          <p className="text-xs text-neutral-500">This usually takes 10–30 seconds</p>
          <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-black" />
          </div>
        </div>
      )}

      {/* Result */}
      {step === "done" && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Your virtual try‑on is ready!
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-2 text-center text-xs uppercase tracking-[0.15em] text-neutral-500">
                Your Photo
              </p>
              <div className="relative aspect-[3/4] overflow-hidden border border-neutral-200">
                {preview && (
                  <Image src={preview} alt="Original" fill className="object-cover" />
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-center text-xs uppercase tracking-[0.15em] text-neutral-500">
                With Outfit
              </p>
              <div className="relative aspect-[3/4] overflow-hidden border border-neutral-200">
                <Image
                  src={result.resultImageUrl}
                  alt="Try-on result"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href={result.resultImageUrl}
              download="tryon-result.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1 text-center"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
            <button onClick={handleReset} className="btn-ghost flex-1">
              Try Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
