"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Loader2, Package, Users, BarChart3, ShoppingBag,
  Plus, Pencil, Trash2, X,
} from "lucide-react"
import {
  adminGetAllOrders,
  adminUpdateOrderStatus,
  getProducts,
  adminDeleteProduct,
} from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import type { Order, Product } from "@/types"
import toast from "react-hot-toast"
import { clsx } from "clsx"
import AdminProductForm from "@/components/AdminProductForm"

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"]
const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-700 bg-amber-50",
  processing: "text-blue-700 bg-blue-50",
  shipped: "text-purple-700 bg-purple-50",
  delivered: "text-emerald-700 bg-emerald-50",
  cancelled: "text-red-600 bg-red-50",
}

type Tab = "orders" | "products"

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>("orders")

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const isAdmin = isAuthenticated && user?.role === "admin"

  // Fetch orders
  useEffect(() => {
    if (!isAdmin) return
    adminGetAllOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setOrdersLoading(false))
  }, [isAdmin])

  // Fetch products
  const fetchProducts = () => {
    setProductsLoading(true)
    getProducts({ limit: 100 })
      .then((r) => setProducts(r.products))
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setProductsLoading(false))
  }

  useEffect(() => {
    if (!isAdmin) return
    fetchProducts()
  }, [isAdmin])

  // Auth guards
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl text-black">Please sign in</p>
          <Link href="/login" className="btn-primary mt-4">Sign In</Link>
        </div>
      </div>
    )
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-serif text-2xl text-black">Access Denied</p>
      </div>
    )
  }

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + o.total, 0)

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId)
    try {
      await adminUpdateOrderStatus(orderId, status)
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: status as Order["status"] } : o))
      )
      toast.success("Order status updated")
    } catch {
      toast.error("Failed to update status")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
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

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingProduct(null)
    fetchProducts()
  }

  const stats = [
    { label: "Total Orders", value: orders.length, icon: Package },
    { label: "Products", value: products.length, icon: ShoppingBag },
    { label: "Revenue", value: `$${totalRevenue.toFixed(0)}`, icon: BarChart3 },
    { label: "Customers", value: "—", icon: Users },
  ]

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-12">
      {/* Header */}
      <div className="mb-12">
        <p className="section-label mb-2">Admin</p>
        <h1 className="section-heading">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">{label}</p>
              <Icon className="h-5 w-5 text-neutral-300" strokeWidth={1.5} />
            </div>
            <p className="mt-3 font-serif text-3xl font-medium text-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="mb-8 flex border-b border-neutral-200">
        {(["orders", "products"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "mr-8 pb-3 text-sm font-medium uppercase tracking-[0.15em] transition-all",
              activeTab === tab
                ? "border-b-2 border-black text-black"
                : "text-neutral-400 hover:text-black"
            )}
          >
            {tab === "orders" ? `Orders (${orders.length})` : `Products (${products.length})`}
          </button>
        ))}
      </div>

      {/* ─── Orders Tab ─── */}
      {activeTab === "orders" && (
        <div>
          {ordersLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-black" strokeWidth={1.5} />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-neutral-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-[0.15em] text-neutral-500">
                    <th className="pb-3 pr-6">Order ID</th>
                    <th className="pb-3 pr-6">Date</th>
                    <th className="pb-3 pr-6">Total</th>
                    <th className="pb-3 pr-6">Items</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.map((order) => (
                    <tr key={order._id} className="group">
                      <td className="py-4 pr-6 font-mono text-xs text-neutral-600">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="py-4 pr-6 text-neutral-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 pr-6 font-medium text-black">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="py-4 pr-6 text-neutral-500">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="py-4">
                        {updatingOrderId === order._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className={clsx(
                              "cursor-pointer border-0 px-2 py-1 text-xs font-medium outline-none",
                              STATUS_STYLES[order.status]
                            )}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Products Tab ─── */}
      {activeTab === "products" && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-neutral-500">{products.length} products in catalog</p>
            <button
              onClick={() => { setEditingProduct(null); setShowForm(true) }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          {productsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-black" strokeWidth={1.5} />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200">
              <ShoppingBag className="h-10 w-10 text-neutral-300 mb-4" strokeWidth={1} />
              <p className="text-sm font-medium text-black">No products yet</p>
              <p className="text-xs text-neutral-400 mt-1">Click "Add Product" above to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-[0.15em] text-neutral-500">
                    <th className="pb-3 pr-4">Image</th>
                    <th className="pb-3 pr-6">Name</th>
                    <th className="pb-3 pr-6">Category</th>
                    <th className="pb-3 pr-6">Price</th>
                    <th className="pb-3 pr-6">Stock</th>
                    <th className="pb-3 pr-6 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-neutral-50 transition">
                      <td className="py-3 pr-4">
                        <div className="relative h-14 w-10 overflow-hidden bg-neutral-100 flex-shrink-0">
                          <Image src={p.image} alt={p.name} fill className="object-cover" />
                        </div>
                      </td>
                      <td className="py-4 pr-6 font-medium text-black max-w-[180px] truncate">{p.name}</td>
                      <td className="py-4 pr-6 capitalize text-neutral-600">{p.category}</td>
                      <td className="py-4 pr-6 text-black font-medium">${p.price.toFixed(2)}</td>
                      <td className="py-4 pr-6 text-neutral-600">{p.stock}</td>
                      <td className="py-4 pr-6 text-center">
                        <span className={clsx(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          p.inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        )}>
                          {p.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-300 text-neutral-700 hover:border-black hover:text-black transition"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p._id, p.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Product Form Modal ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
