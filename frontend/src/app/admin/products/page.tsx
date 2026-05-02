"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { getProducts, adminDeleteProduct } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import type { Product } from "@/types"
import toast from "react-hot-toast"
import AdminProductForm from "@/components/AdminProductForm"

export default function AdminProductsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const isAdmin = isAuthenticated && user?.role === "admin"

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await getProducts({ limit: 100 }) // fetch all for admin
      setProducts(res.products)
    } catch {
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    fetchProducts()
  }, [isAdmin])

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-serif text-2xl text-black">Access Denied</p>
      </div>
    )
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return
    
    try {
      await adminDeleteProduct(id)
      setProducts((prev) => prev.filter((p) => p._id !== id))
      toast.success("Product deleted")
    } catch {
      toast.error("Failed to delete product")
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingProduct(null)
    fetchProducts() // Refresh the list
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-12 relative">
      <Link
        href="/admin"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-12 flex items-end justify-between">
        <div>
          <p className="section-label mb-2">Admin</p>
          <h1 className="section-heading">Manage Products</h1>
        </div>
        <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-black" strokeWidth={1.5} />
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-500">No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-[0.15em] text-neutral-500">
                <th className="pb-3 pr-6">Image</th>
                <th className="pb-3 pr-6">Name</th>
                <th className="pb-3 pr-6">Category</th>
                <th className="pb-3 pr-6">Price</th>
                <th className="pb-3 pr-6">Stock</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => (
                <tr key={p._id} className="group">
                  <td className="py-3 pr-6">
                    <div className="relative h-12 w-10 overflow-hidden bg-neutral-100">
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    </div>
                  </td>
                  <td className="py-4 pr-6 font-medium text-black">
                    {p.name}
                  </td>
                  <td className="py-4 pr-6 text-neutral-600 capitalize">
                    {p.category}
                  </td>
                  <td className="py-4 pr-6 text-black">
                    ${p.price.toFixed(2)}
                  </td>
                  <td className="py-4 pr-6">
                    <span className={p.inStock ? "text-emerald-600" : "text-red-600"}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="text-neutral-500 hover:text-black"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p._id, p.name)}
                        className="text-neutral-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-2xl">
            <AdminProductForm 
              initialData={editingProduct} 
              onSuccess={handleFormSuccess} 
              onCancel={() => setShowForm(false)} 
            />
          </div>
        </div>
      )}
    </div>
  )
}
