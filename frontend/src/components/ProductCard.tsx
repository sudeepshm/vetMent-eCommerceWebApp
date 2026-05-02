"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ShoppingBag, Sparkles, Star } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import type { Product } from "@/types"
import toast from "react-hot-toast"
import { clsx } from "clsx"

type ProductCardProps = {
  product: Product
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "")
  const addItem = useCartStore((s) => s.addItem)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.inStock) return
    addItem(
      product,
      selectedSize,
      product.colors[0]?.name ?? "",
      1
    )
    toast.success(`${product.name} added to cart`, {
      icon: "🛍️",
      duration: 2000,
    })
  }

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null

  return (
    <Link
      href={`/product/${product._id}`}
      className="group block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Image Container ── */}
      <div className="relative overflow-hidden bg-neutral-100">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={clsx(
              "object-cover transition-transform duration-700 ease-out",
              isHovered && product.images?.[1] ? "opacity-0" : "opacity-100"
            )}
          />

          {/* Secondary image on hover */}
          {product.images?.[1] && (
            <Image
              src={product.images[1]}
              alt={`${product.name} alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={clsx(
                "absolute inset-0 object-cover transition-all duration-700 ease-out",
                isHovered ? "opacity-100 scale-105" : "opacity-0 scale-100"
              )}
            />
          )}

          {/* Scale effect when no second image */}
          {!product.images?.[1] && (
            <div
              className={clsx(
                "absolute inset-0 transition-transform duration-700 ease-out",
                isHovered ? "scale-105" : "scale-100"
              )}
            />
          )}
        </div>

        {/* ── Badges ── */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.category === "new" && (
            <span className="badge-new">New</span>
          )}
          {discount && <span className="badge-sale">-{discount}%</span>}
          {!product.inStock && (
            <span className="badge bg-neutral-600 text-white">Sold Out</span>
          )}
        </div>

        {/* ── Quick Actions Overlay ── */}
        <div
          className={clsx(
            "absolute bottom-0 left-0 right-0 flex flex-col gap-2 p-3 transition-all duration-300",
            isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}
        >
          {/* Size Pills */}
          {product.sizes.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {product.sizes.slice(0, 5).map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedSize(size)
                  }}
                  className={clsx(
                    "h-7 min-w-[28px] px-2 text-xs font-medium transition-all duration-200",
                    selectedSize === size
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-black hover:text-white"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleQuickAdd}
            disabled={!product.inStock}
            className={clsx(
              "flex w-full items-center justify-center gap-2 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-all duration-200",
              product.inStock
                ? "bg-black text-white hover:bg-neutral-800"
                : "cursor-not-allowed bg-neutral-400 text-white"
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {product.inStock ? "Quick Add" : "Sold Out"}
          </button>

          {/* Try On */}
          <Link
            href={`/try-on?productId=${product._id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-center gap-1.5 bg-white/90 py-2 text-xs font-medium uppercase tracking-[0.15em] text-black transition hover:bg-white"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Try On
          </Link>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="pt-4">
        <h3 className="text-sm font-light tracking-wide text-black transition-opacity group-hover:opacity-80">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={clsx(
                    "h-3 w-3",
                    i < Math.floor(product.rating)
                      ? "fill-black text-black"
                      : "fill-neutral-200 text-neutral-200"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-500">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <p className="text-sm tracking-[0.1em] text-black">${product.price.toFixed(2)}</p>
          {product.originalPrice && product.originalPrice > product.price && (
            <p className="text-xs tracking-[0.1em] text-neutral-400 line-through">
              ${product.originalPrice.toFixed(2)}
            </p>
          )}
        </div>

        {/* Color swatches */}
        {product.colors.length > 1 && (
          <div className="mt-2 flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((color) => (
              <div
                key={color.name}
                title={color.name}
                className="h-3 w-3 rounded-full border border-neutral-300"
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-neutral-400">+{product.colors.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
