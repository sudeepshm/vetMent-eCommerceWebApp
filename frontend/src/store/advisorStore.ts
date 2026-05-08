/**
 * advisorStore.ts
 *
 * Zustand store for the Conversational Style Advisor.
 * Chat history is backed by MongoDB (per-user, survives logout/login).
 *
 * Behaviour:
 *  - Authenticated users: loadHistory() fetches messages from /api/ai/advisor/history on open
 *  - Guests: messages live in local state only (cleared on page refresh)
 *  - clearSession() wipes local state AND the MongoDB record for authenticated users
 */

import { create } from "zustand"
import api from "@/lib/api"

export type MessageRole = "user" | "advisor"

export interface ChatMessage {
  id: string
  role: MessageRole
  text: string
  timestamp: Date
  imagePreview?: string // base64 data URL for display only
}

interface AdvisorState {
  isOpen: boolean
  messages: ChatMessage[]
  isLoading: boolean
  historyLoaded: boolean // prevents duplicate fetches

  toggleOpen: () => void
  setOpen: (open: boolean) => void
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void
  setLoading: (loading: boolean) => void
  clearSession: (isAuthenticated: boolean) => Promise<void>
  loadHistory: () => Promise<void>
}

export const useAdvisorStore = create<AdvisorState>((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  historyLoaded: false,

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),

  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          ...msg,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date(),
        },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  /**
   * Load persisted history from MongoDB.
   * Only runs once per session (guarded by historyLoaded flag).
   */
  loadHistory: async () => {
    if (get().historyLoaded || get().isLoading) return

    try {
      const { data } = await api.get<{
        success: boolean
        messages: Array<{
          _id: string
          role: MessageRole
          text: string
          imagePreview?: string | null
          timestamp: string
        }>
      }>("/ai/advisor/history")

      if (data.success && data.messages.length > 0) {
        const mapped: ChatMessage[] = data.messages.map((m) => ({
          id: m._id,
          role: m.role,
          text: m.text,
          imagePreview: m.imagePreview ?? undefined,
          timestamp: new Date(m.timestamp),
        }))
        set({ messages: mapped, historyLoaded: true })
      } else {
        set({ historyLoaded: true })
      }
    } catch {
      // Not authenticated or network error — silently continue with empty state
      set({ historyLoaded: true })
    }
  },

  /**
   * Clear conversation — wipes local state and (if authenticated) the DB record.
   */
  clearSession: async (isAuthenticated: boolean) => {
    set({ messages: [], isLoading: false, historyLoaded: false })

    if (isAuthenticated) {
      try {
        await api.delete("/ai/advisor/history")
      } catch {
        // silently ignore — local state is already cleared
      }
    }
  },
}))
