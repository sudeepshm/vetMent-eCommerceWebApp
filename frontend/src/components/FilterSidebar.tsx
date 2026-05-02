"use client"

import { useState } from "react"
import { ChevronDown, X, SlidersHorizontal } from "lucide-react"
import { clsx } from "clsx"
import type { ProductFilters } from "@/types"

interface FilterSidebarProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
}

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "New Arrivals", value: "new" },
  { label: "Accessories", value: "accessories" },
]

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36"]

const PRICE_RANGES = [
  { label: "All prices", min: undefined, max: undefined },
  { label: "Under $100", min: 0, max: 100 },
  { label: "$100 – $250", min: 100, max: 250 },
  { label: "$250 – $500", min: 250, max: 500 },
  { label: "Over $500", min: 500, max: undefined },
]

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
]

function Accordion({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-neutral-200 py-5">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between text-sm font-medium uppercase tracking-[0.15em] text-black"
      >
        {title}
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-neutral-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300",
          open ? "mt-4 max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const update = (patch: Partial<ProductFilters>) =>
    onFiltersChange({ ...filters, ...patch, page: 1 })

  const activeCount = [
    filters.category,
    filters.size,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.sort && filters.sort !== "newest",
  ].filter(Boolean).length

  const clearAll = () =>
    onFiltersChange({ page: 1, limit: filters.limit, sort: "newest" })

  const sidebar = (
    <div className="space-y-0">
      {/* ── Sort ── */}
      <Accordion title="Sort By">
        <div className="space-y-2">
          {SORT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-3 group">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={(filters.sort ?? "newest") === opt.value}
                onChange={() => update({ sort: opt.value as ProductFilters["sort"] })}
                className="sr-only"
              />
              <div
                className={clsx(
                  "h-3.5 w-3.5 rounded-full border-2 transition-all",
                  (filters.sort ?? "newest") === opt.value
                    ? "border-black bg-black"
                    : "border-neutral-300 group-hover:border-neutral-600"
                )}
              />
              <span className="text-sm text-neutral-700 group-hover:text-black">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </Accordion>

      {/* ── Category ── */}
      <Accordion title="Category">
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat.value} className="flex cursor-pointer items-center gap-3 group">
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={(filters.category ?? "") === cat.value}
                onChange={() => update({ category: cat.value || undefined })}
                className="sr-only"
              />
              <div
                className={clsx(
                  "h-3.5 w-3.5 rounded-full border-2 transition-all",
                  (filters.category ?? "") === cat.value
                    ? "border-black bg-black"
                    : "border-neutral-300 group-hover:border-neutral-600"
                )}
              />
              <span className="text-sm text-neutral-700 group-hover:text-black">
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </Accordion>

      {/* ── Price ── */}
      <Accordion title="Price">
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => {
            const isActive =
              filters.minPrice === range.min && filters.maxPrice === range.max
            return (
              <label key={range.label} className="flex cursor-pointer items-center gap-3 group">
                <input
                  type="radio"
                  name="price"
                  checked={isActive}
                  onChange={() =>
                    update({ minPrice: range.min, maxPrice: range.max })
                  }
                  className="sr-only"
                />
                <div
                  className={clsx(
                    "h-3.5 w-3.5 rounded-full border-2 transition-all",
                    isActive
                      ? "border-black bg-black"
                      : "border-neutral-300 group-hover:border-neutral-600"
                  )}
                />
                <span className="text-sm text-neutral-700 group-hover:text-black">
                  {range.label}
                </span>
              </label>
            )
          })}
        </div>
      </Accordion>

      {/* ── Sizes ── */}
      <Accordion title="Size" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() =>
                update({ size: filters.size === size ? undefined : size })
              }
              className={clsx(
                "h-9 min-w-[36px] px-2 text-sm transition-all duration-150",
                filters.size === size
                  ? "bg-black text-white"
                  : "border border-neutral-300 text-neutral-700 hover:border-black hover:text-black"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </Accordion>

      {/* ── Clear ── */}
      {activeCount > 0 && (
        <div className="pt-4">
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-sm text-neutral-500 underline underline-offset-2 transition hover:text-black"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 lg:block">{sidebar}</aside>

      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 border border-neutral-300 px-4 py-2.5 text-sm text-black transition hover:border-black"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] text-white">
              {activeCount}
            </span>
          )}
        </button>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto bg-white p-6 shadow-xl animate-slide-up">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-[0.2em]">
                  Filters
                </h2>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              {sidebar}
              <button
                onClick={() => setMobileOpen(false)}
                className="btn-primary mt-6 w-full"
              >
                Apply Filters
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
