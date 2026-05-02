"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Minus, Plus, ShoppingBag, Sparkles, Heart, ArrowLeft, Loader2 } from "lucide-react"
import { getProductById } from "@/lib/api"
import { useCartStore } from "@/store/cartStore"
import SizeSelector from "@/components/SizeSelector"
import StarRating from "@/components/StarRating"
import type { Product } from "@/types"
import toast from "react-hot-toast"
import { clsx } from "clsx"

interface ProductPageProps {
  params: { id: string }
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)

  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const p = await getProductById(params.id)
        setProduct(p)
        setSelectedSize(p.sizes[0] ?? "")
        setSelectedColor(p.colors[0]?.name ?? "")
      } catch {
        notFound()
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [params.id])

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="skeleton aspect-[3/4] w-full" />
          <div className="space-y-6">
            <div className="skeleton h-8 w-2/3" />
            <div className="skeleton h-6 w-1/4" />
            <div className="skeleton h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const allImages = [product.image, ...(product.images?.slice(1) ?? [])]
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size")
      return
    }
    addItem(product, selectedSize, selectedColor, quantity)
    toast.success(`${product.name} added to cart`, { icon: "🛍️" })
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-10 md:px-12">
      {/* Back */}
      <Link
        href="/products"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Collection
      </Link>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 xl:gap-20">
        {/* ─── Image Gallery ─── */}
        <div className="flex gap-4">
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="hidden flex-col gap-2 sm:flex">
              {allImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={clsx(
                    "relative h-20 w-16 overflow-hidden transition-all",
                    selectedImageIndex === i
                      ? "ring-1 ring-black ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  <Image src={src} alt={`${product.name} view ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="relative flex-1 aspect-[3/4] overflow-hidden bg-neutral-100">
            <Image
              src={allImages[selectedImageIndex] ?? product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-all duration-500"
            />
            {discount && (
              <div className="absolute left-4 top-4">
                <span className="badge-sale">-{discount}%</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Product Info ─── */}
        <div className="space-y-7 lg:py-4">
          {/* Title + Rating */}
          <div>
            <p className="section-label mb-2">{product.category}</p>
            <h1 className="font-serif text-4xl font-medium text-black">{product.name}</h1>
            {product.rating > 0 && (
              <div className="mt-3">
                <StarRating rating={product.rating} reviewCount={product.reviewCount} />
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-light tracking-wide text-black">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-neutral-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="divider" />

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-black">
                Color{" "}
                <span className="font-normal text-neutral-500">
                  — {selectedColor}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    title={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={clsx(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      selectedColor === color.name
                        ? "border-black ring-1 ring-black ring-offset-2"
                        : "border-transparent hover:border-neutral-400"
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes.length > 0 && (
            <SizeSelector
              sizes={product.sizes}
              selectedSize={selectedSize}
              onSelect={setSelectedSize}
            />
          )}

          {/* Quantity */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-black">Quantity</p>
            <div className="flex items-center gap-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center border border-neutral-300 transition hover:border-black hover:text-black"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-11 min-w-[44px] items-center justify-center border-y border-neutral-300 text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="flex h-11 w-11 items-center justify-center border border-neutral-300 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="btn-primary flex-1"
            >
              <ShoppingBag className="h-4 w-4" />
              {product.inStock ? "Add to Cart" : "Sold Out"}
            </button>

            <Link
              href={`/try-on?productId=${product._id}`}
              className="btn-secondary flex-1 text-center"
            >
              <Sparkles className="h-4 w-4" />
              AI Try‑On
            </Link>

            <button
              onClick={() => setWishlisted((p) => !p)}
              aria-label="Wishlist"
              className={clsx(
                "flex h-12 w-12 flex-shrink-0 items-center justify-center border transition",
                wishlisted
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-black hover:text-black"
              )}
            >
              <Heart
                className="h-4 w-4"
                fill={wishlisted ? "currentColor" : "none"}
              />
            </button>
          </div>

          <div className="divider" />

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-black">
              Description
            </h3>
            <p className="text-sm leading-7 text-neutral-600">{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-neutral-200 px-3 py-1 text-xs text-neutral-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
