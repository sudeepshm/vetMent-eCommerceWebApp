"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import ProductCard from "@/components/ProductCard"
import FilterSidebar from "@/components/FilterSidebar"
import type { Product, ProductFilters } from "@/types"
import { getProducts } from "@/lib/api"
import { Loader2 } from "lucide-react"

function ProductGrid({ products, loading }: { products: Product[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton aspect-[3/4] w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-serif text-2xl text-black">No products found</p>
        <p className="mt-2 text-sm text-neutral-500">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get("category") ?? undefined,
    sort: "newest",
    page: 1,
    limit: 12,
  })

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await getProducts(filters)
        setProducts(res.products)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [filters])

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
    // Sync category to URL
    const params = new URLSearchParams()
    if (newFilters.category) params.set("category", newFilters.category)
    router.replace(`/products${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    })
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-12">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="section-label mb-2">Collection</p>
          <h1 className="section-heading">
            {filters.category
              ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1)
              : "All Products"}
          </h1>
        </div>
        <p className="hidden text-sm text-neutral-500 sm:block">
          {loading ? "—" : total} item{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Mobile Filters */}
      <div className="mb-8 flex items-center gap-4 lg:hidden">
        <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} />
        <p className="text-sm text-neutral-500">
          {loading ? "Loading…" : `${total} items`}
        </p>
      </div>

      {/* Layout */}
      <div className="flex gap-12">
        {/* Desktop Sidebar */}
        <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          <ProductGrid products={products} loading={loading} />

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                  className={
                    (filters.page ?? 1) === i + 1
                      ? "flex h-9 w-9 items-center justify-center bg-black text-sm text-white"
                      : "flex h-9 w-9 items-center justify-center border border-neutral-300 text-sm text-neutral-600 transition hover:border-black hover:text-black"
                  }
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-black" strokeWidth={1.5} />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}
