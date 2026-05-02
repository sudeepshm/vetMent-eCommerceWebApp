import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-black" strokeWidth={1.5} />
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Loading…</p>
    </div>
  )
}
