/**
 * tryOnStore.ts
 *
 * Zustand store for the Virtual Try-On session.
 * Keeps the selected product, uploaded image, and result in session
 * so navigation within the try-on flow doesn't reset the state.
 */

import { create } from "zustand"
import type { Product } from "@/types"
import type { TryOnRecord } from "@/types"

export type TryOnStatus = "idle" | "selected" | "processing" | "done" | "error"

interface TryOnState {
  selectedProduct: Product | null
  userImagePreview: string | null   // object URL for display
  userImageFile: File | null
  result: TryOnRecord | null
  status: TryOnStatus
  error: string | null

  setProduct: (product: Product | null) => void
  setUserImage: (file: File, preview: string) => void
  setStatus: (status: TryOnStatus) => void
  setResult: (result: TryOnRecord) => void
  setError: (error: string) => void
  reset: () => void
}

export const useTryOnStore = create<TryOnState>((set) => ({
  selectedProduct: null,
  userImagePreview: null,
  userImageFile: null,
  result: null,
  status: "idle",
  error: null,

  setProduct: (product) => set({ selectedProduct: product }),

  setUserImage: (file, preview) =>
    set({ userImageFile: file, userImagePreview: preview, status: "selected", error: null }),

  setStatus: (status) => set({ status }),

  setResult: (result) => set({ result, status: "done", error: null }),

  setError: (error) => set({ error, status: "error" }),

  reset: () =>
    set({
      userImagePreview: null,
      userImageFile: null,
      result: null,
      status: "idle",
      error: null,
    }),
}))
