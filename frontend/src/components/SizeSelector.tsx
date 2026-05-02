"use client"

import { clsx } from "clsx"

interface SizeSelectorProps {
  sizes: string[]
  selectedSize: string
  onSelect: (size: string) => void
  outOfStock?: string[]
}

export default function SizeSelector({
  sizes,
  selectedSize,
  onSelect,
  outOfStock = [],
}: SizeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-black">
          Size
          {selectedSize && (
            <span className="ml-2 font-normal text-neutral-500">— {selectedSize}</span>
          )}
        </span>
        <button className="text-xs text-neutral-500 underline underline-offset-2 transition hover:text-black">
          Size Guide
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const unavailable = outOfStock.includes(size)
          const selected = selectedSize === size

          return (
            <button
              key={size}
              onClick={() => !unavailable && onSelect(size)}
              disabled={unavailable}
              aria-label={`Size ${size}${unavailable ? " — out of stock" : ""}`}
              className={clsx(
                "relative h-11 min-w-[44px] px-3 text-sm font-medium transition-all duration-150",
                selected
                  ? "bg-black text-white"
                  : unavailable
                  ? "cursor-not-allowed border border-neutral-200 text-neutral-300 line-through"
                  : "border border-neutral-300 text-neutral-800 hover:border-black hover:text-black"
              )}
            >
              {size}
              {unavailable && !selected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-px w-full -rotate-45 bg-neutral-300" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
