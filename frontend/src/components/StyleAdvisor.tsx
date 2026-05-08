"use client"

/**
 * StyleAdvisor.tsx
 *
 * Floating conversational style advisor powered by Gemini.
 * Renders as a fixed bottom-right chat widget accessible on every page.
 * Supports text messages and optional outfit image uploads.
 */

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Sparkles,
  X,
  Send,
  ImagePlus,
  Trash2,
  Loader2,
  ChevronDown,
  Bot,
} from "lucide-react"
import { clsx } from "clsx"
import { useAdvisorStore } from "@/store/advisorStore"
import { useAuthStore } from "@/store/authStore"
import { postAdvisorMessage } from "@/lib/api"

// ── Tiny markdown-like renderer: converts [text](/url) to <a> links ──
function renderReply(text: string) {
  const parts = text.split(/(\[([^\]]+)\]\(([^)]+)\))/g)
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < parts.length) {
    const part = parts[i]
    if (part.startsWith("[") && parts[i + 2]) {
      // already consumed by split groups — skip
      i++
      continue
    }
    // Check for link pattern group
    if (i + 2 < parts.length && parts[i + 1]?.startsWith("[")) {
      i++
      continue
    }
    elements.push(
      <span key={i} style={{ whiteSpace: "pre-wrap" }}>
        {part}
      </span>
    )
    i++
  }

  // Re-parse with regex for reliable rendering
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={lastIndex} style={{ whiteSpace: "pre-wrap" }}>
          {text.slice(lastIndex, match.index)}
        </span>
      )
    }
    const [, label, href] = match
    nodes.push(
      <Link
        key={match.index}
        href={href}
        className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-black underline-offset-2 hover:underline"
      >
        {label}
      </Link>
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    nodes.push(
      <span key={lastIndex} style={{ whiteSpace: "pre-wrap" }}>
        {text.slice(lastIndex)}
      </span>
    )
  }
  return nodes.length ? nodes : [<span key={0} style={{ whiteSpace: "pre-wrap" }}>{text}</span>]
}

// ── Starter prompts shown in empty state ──
const STARTER_PROMPTS = [
  "What's trending for women this season?",
  "Find me a casual outfit under $200",
  "Suggest a smart-casual look for men",
  "What accessories pair well with a black dress?",
]

export default function StyleAdvisor() {
  const { isOpen, toggleOpen, messages, isLoading, addMessage, setLoading, clearSession, loadHistory, historyLoaded } =
    useAdvisorStore()
  const { isAuthenticated } = useAuthStore()

  const [input, setInput] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen, isLoading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Load persisted history from MongoDB when panel opens (authenticated users only)
  useEffect(() => {
    if (isOpen && isAuthenticated && !historyLoaded && messages.length === 0) {
      loadHistory()
    }
  }, [isOpen, isAuthenticated, historyLoaded, messages.length, loadHistory])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ""
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const sendMessage = useCallback(
    async (text: string, imgFile?: File | null, imgPreview?: string | null) => {
      const trimmed = text.trim()
      if (!trimmed && !imgFile) return

      // Add user message to store
      addMessage({ role: "user", text: trimmed, imagePreview: imgPreview ?? undefined })
      setInput("")
      clearImage()
      setLoading(true)

      try {
        let imageBase64: string | undefined
        let imageMime: string | undefined

        if (imgFile) {
          const buffer = await imgFile.arrayBuffer()
          imageBase64 = Buffer.from(buffer).toString("base64")
          imageMime = imgFile.type
        }

        const reply = await postAdvisorMessage({
          message: trimmed || "Analyse this outfit",
          imageBase64,
          imageMime,
        })

        addMessage({ role: "advisor", text: reply })
      } catch (err: unknown) {
        const isAxiosErr = err && typeof err === "object" && "response" in err
        const status = isAxiosErr ? (err as { response?: { status?: number } }).response?.status : null
        let msg: string
        if (!isAxiosErr || status === 0) {
          msg = "Cannot reach the server. Please make sure the backend is running on port 5000."
        } else if (status === 401) {
          msg = "Please sign in to use the Style Advisor."
        } else if (status === 503) {
          msg = "Style advisor is not configured — GEMINI_API_KEY is missing in backend/.env."
        } else {
          msg = err instanceof Error ? err.message : "Something went wrong. Please try again."
        }
        addMessage({ role: "advisor", text: `⚠️ ${msg}` })

      } finally {
        setLoading(false)
      }
    },
    [addMessage, setLoading]
  )

  const handleSend = () => sendMessage(input, imageFile, imagePreview)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* ── Floating Toggle Button ── */}
      <button
        id="style-advisor-toggle"
        onClick={toggleOpen}
        aria-label="Open Style Advisor"
        className={clsx(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
          isOpen
            ? "scale-90 bg-neutral-800 text-white"
            : "bg-black text-white hover:scale-105 hover:bg-neutral-800"
        )}
      >
        {isOpen ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
      </button>

      {/* ── Chat Panel ── */}
      <div
        id="style-advisor-panel"
        className={clsx(
          "fixed bottom-24 right-6 z-50 flex w-[22rem] flex-col overflow-hidden rounded-none border border-neutral-200 bg-white shadow-2xl transition-all duration-300 ease-in-out",
          isOpen
            ? "max-h-[580px] opacity-100 translate-y-0 pointer-events-auto"
            : "max-h-0 opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{ maxWidth: "calc(100vw - 3rem)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-black px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={1.5} />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white">
              Style Advisor
            </p>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => clearSession(isAuthenticated)}
                className="text-neutral-400 transition hover:text-white"
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={toggleOpen}
              className="text-neutral-400 transition hover:text-white"
              aria-label="Close advisor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: "300px", maxHeight: "380px" }}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-black">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-none bg-neutral-50 border border-neutral-100 px-3 py-2 text-xs text-neutral-700 leading-relaxed">
                  Hello! I&apos;m your personal style advisor. Ask me about outfits, trends, or upload a photo for personalised recommendations.
                </div>
              </div>
              <div className="space-y-1.5">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left rounded-none border border-neutral-200 px-3 py-2 text-xs text-neutral-600 transition hover:border-black hover:text-black"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  "flex items-start gap-2",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={clsx(
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    msg.role === "user"
                      ? "bg-neutral-200 text-black"
                      : "bg-black text-white"
                  )}
                >
                  {msg.role === "user" ? "U" : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div className={clsx("flex flex-col gap-1.5 max-w-[80%]", msg.role === "user" ? "items-end" : "items-start")}>
                  {msg.imagePreview && (
                    <div className="relative h-24 w-20 overflow-hidden rounded border border-neutral-200">
                      <Image src={msg.imagePreview} alt="Uploaded" fill className="object-cover" />
                    </div>
                  )}
                  {msg.text && (
                    <div
                      className={clsx(
                        "rounded-none px-3 py-2 text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-black text-white"
                          : "bg-neutral-50 border border-neutral-100 text-neutral-800"
                      )}
                    >
                      {msg.role === "advisor" ? renderReply(msg.text) : msg.text}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-black">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex items-center gap-1.5 rounded-none border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                <Loader2 className="h-3 w-3 animate-spin text-neutral-500" />
                <span className="text-xs text-neutral-500">Styling…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Image preview strip */}
        {imagePreview && (
          <div className="flex items-center gap-2 border-t border-neutral-100 px-4 py-2">
            <div className="relative h-10 w-8 overflow-hidden rounded border border-neutral-200">
              <Image src={imagePreview} alt="Attachment" fill className="object-cover" />
            </div>
            <span className="flex-1 truncate text-xs text-neutral-500">{imageFile?.name}</span>
            <button onClick={clearImage} className="text-neutral-400 hover:text-black">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-neutral-200 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              id="style-advisor-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about styles, outfits…"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none border border-neutral-200 bg-white px-3 py-2 text-xs text-black placeholder-neutral-400 outline-none focus:border-black disabled:opacity-50"
              style={{ minHeight: "36px", maxHeight: "80px" }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="sr-only"
              id="advisor-image-input"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-neutral-200 text-neutral-400 transition hover:border-black hover:text-black disabled:opacity-40"
              aria-label="Attach image"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !imageFile)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-black text-white transition hover:bg-neutral-800 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-neutral-400">
            Powered by Gemini · Press Enter to send
          </p>
        </div>
      </div>
    </>
  )
}
