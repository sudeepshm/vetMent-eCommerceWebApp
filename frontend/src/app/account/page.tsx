"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Package, Loader2, ChevronRight } from "lucide-react"
import { getMyOrders } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import type { Order } from "@/types"
import { clsx } from "clsx"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
}

export default function AccountPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return
    getMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
        <p className="font-serif text-2xl text-black">Please sign in</p>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-12">
      <div className="mb-12">
        <p className="section-label mb-2">My Account</p>
        <h1 className="section-heading">Hello, {user?.name?.split(" ")[0]}</h1>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-1">
          {[
            { label: "Orders", href: "/account", active: true },
            { label: "Try-On History", href: "/try-on" },
            { label: "Settings", href: "/account/settings" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={clsx(
                "flex items-center justify-between px-4 py-3 text-sm transition",
                link.active
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
              )}
            >
              {link.label}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </aside>

        {/* Orders */}
        <div>
          <h2 className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-black">
            Order History
          </h2>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-black" strokeWidth={1.5} />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <Package className="h-12 w-12 text-neutral-300" strokeWidth={1} />
              <p className="text-sm text-neutral-500">No orders yet</p>
              <Link href="/products" className="btn-secondary">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="border border-neutral-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-black">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={clsx(
                          "px-2.5 py-1 text-xs font-medium capitalize",
                          STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-600"
                        )}
                      >
                        {order.status}
                      </span>
                      <span className="text-sm font-medium text-black">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item, i) => (
                      <p key={i} className="text-xs text-neutral-500">
                        {item.quantity}× {item.product.name}
                        {i < Math.min(order.items.length, 3) - 1 ? "," : ""}
                      </p>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-neutral-400">
                        +{order.items.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
