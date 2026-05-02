"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Sparkles, ChevronRight, Loader2 } from "lucide-react"
import UploadImage from "@/components/UploadImage"
import { getProductById, getProducts } from "@/lib/api"
import type { Product } from "@/types"

function TryOnContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get("productId")

  const [product, setProduct] = useState<Product | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(!!productId)
  const [recentProducts, setRecentProducts] = useState<Product[]>([])

  useEffect(() => {
    if (productId) {
      getProductById(productId)
        .then(setProduct)
        .catch(() => setProduct(null))
        .finally(() => setLoadingProduct(false))
    } else {
      getProducts({ limit: 6, sort: "newest" })
        .then((r) => setRecentProducts(r.products))
        .catch(() => {})
    }
  }, [productId])

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="section-label mb-3">AI Technology</p>
        <h1 className="section-heading mb-4">Virtual Try‑On</h1>
        <p className="mx-auto max-w-lg text-sm leading-7 text-neutral-500">
          Upload your photo, select a garment, and our AI will show you how it
          looks on your body in seconds.
        </p>
      </div>

      {/* Steps */}
      <div className="mb-16 grid grid-cols-3 gap-6 text-center">
        {[
          { n: "01", label: "Select a garment" },
          { n: "02", label: "Upload your photo" },
          { n: "03", label: "See the result" },
        ].map((step) => (
          <div key={step.n} className="flex flex-col items-center gap-2">
            <span className="font-serif text-3xl text-neutral-200">{step.n}</span>
            <span className="text-sm text-neutral-600">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_480px]">
        {/* ── Left: Product Selection ── */}
        <div>
          {loadingProduct ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-black" strokeWidth={1.5} />
            </div>
          ) : product ? (
            <div className="space-y-6">
              <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                <Link href="/products" className="hover:text-black">Collection</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-black">{product.name}</span>
              </div>

              <div className="flex gap-5 rounded-none border border-neutral-200 p-4">
                <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden bg-neutral-100">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <p className="font-medium text-black">{product.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">${product.price.toFixed(2)}</p>
                  </div>
                  <Link
                    href="/products"
                    className="text-xs text-neutral-500 underline underline-offset-2 hover:text-black"
                  >
                    Choose different item
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-black">
                  Step 1 — Choose a Garment
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Select an item from our collection to try on.
                </p>
              </div>

              {recentProducts.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3">
                  {recentProducts.map((p) => (
                    <Link
                      key={p._id}
                      href={`/try-on?productId=${p._id}`}
                      className="group relative aspect-[3/4] overflow-hidden bg-neutral-100"
                    >
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                        <p className="text-xs text-white">{p.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <Link href="/products" className="btn-secondary inline-flex">
                Browse Full Collection
              </Link>
            </div>
          )}
        </div>

        {/* ── Right: Upload Panel ── */}
        <div className="space-y-6">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-black">
            Step 2 — Upload Your Photo
          </h2>
          <UploadImage
            productId={product?._id ?? ""}
            garmentImageUrl={product?.image ?? ""}
            productName={product?.name ?? "this item"}
          />

          {/* Tips */}
          <div className="border border-neutral-200 p-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-black">
              <Sparkles className="h-3.5 w-3.5" />
              Tips for best results
            </p>
            <ul className="space-y-1.5 text-xs text-neutral-500">
              <li>• Use a full-body photo with clear lighting</li>
              <li>• Stand in a neutral pose facing the camera</li>
              <li>• Wear form-fitting or solid-color clothes</li>
              <li>• Ensure background is uncluttered</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TryOnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-black" strokeWidth={1.5} />
        </div>
      }
    >
      <TryOnContent />
    </Suspense>
  )
}
