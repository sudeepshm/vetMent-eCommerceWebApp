/**
 * tryOnStore.ts
 *
 * Zustand store for the Virtual Try-On session.
 * Supports asynchronous job tracking, live progress percentage, stage reporting,
 * and anthropometric sizing advisory state.
 */

import { create } from "zustand"
import type { Product, TryOnRecord, SizingAdvisory } from "@/types"

export type TryOnStatus = "idle" | "selected" | "processing" | "done" | "error"

interface TryOnState {
  selectedProduct: Product | null
  userImagePreview: string | null // object URL for display
  userImageFile: File | null
  result: TryOnRecord | null
  status: TryOnStatus
  error: string | null

  // Asynchronous job states
  jobId: string | null
  progressPercentage: number
  currentStage: string
  sizingAdvisory: SizingAdvisory | null
  telemetry: any | null
  userHeightCm: number

  setProduct: (product: Product | null) => void
  setUserImage: (file: File, preview: string) => void
  setStatus: (status: TryOnStatus) => void
  setResult: (result: TryOnRecord) => void
  setError: (error: string) => void
  setJobId: (jobId: string | null) => void
  setProgress: (percentage: number, stage?: string) => void
  setSizingAdvisory: (advisory: SizingAdvisory | null) => void
  setUserHeightCm: (height: number) => void
  reset: () => void
}

export const useTryOnStore = create<TryOnState>((set) => ({
  selectedProduct: null,
  userImagePreview: null,
  userImageFile: null,
  result: null,
  status: "idle",
  error: null,

  jobId: null,
  progressPercentage: 0,
  currentStage: "QUEUED",
  sizingAdvisory: null,
  telemetry: null,
  userHeightCm: 175,

  setProduct: (product) => set({ selectedProduct: product }),

  setUserImage: (file, preview) =>
    set({
      userImageFile: file,
      userImagePreview: preview,
      status: "selected",
      error: null,
      progressPercentage: 0,
      currentStage: "READY",
    }),

  setStatus: (status) => set({ status }),

  setResult: (result) =>
    set({
      result,
      status: "done",
      error: null,
      progressPercentage: 100,
      currentStage: "COMPLETED",
      sizingAdvisory: result.sizingAdvisory || null,
      telemetry: result.telemetry || null,
    }),

  setError: (error) => set({ error, status: "error", progressPercentage: 0 }),

  setJobId: (jobId) => set({ jobId }),

  setProgress: (progressPercentage, stage) =>
    set((state) => ({
      progressPercentage,
      currentStage: stage || state.currentStage,
    })),

  setSizingAdvisory: (sizingAdvisory) => set({ sizingAdvisory }),

  setUserHeightCm: (userHeightCm) => set({ userHeightCm }),

  reset: () =>
    set({
      userImagePreview: null,
      userImageFile: null,
      result: null,
      status: "idle",
      error: null,
      jobId: null,
      progressPercentage: 0,
      currentStage: "QUEUED",
      sizingAdvisory: null,
      telemetry: null,
    }),
}))
