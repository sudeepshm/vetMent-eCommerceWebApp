"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { useAuthStore } from "@/store/authStore"
import { createOrder } from "@/lib/api"
import type { ShippingAddress } from "@/types"
import toast from "react-hot-toast"

const SHIPPING_THRESHOLD = 150
const SHIPPING_COST = 12.99

const INITIAL_ADDRESS: ShippingAddress = {
  fullName: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  phone: "",
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(INITIAL_ADDRESS)
  const [loading, setLoading] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({})

  const sub = subtotal()
  const shipping = sub >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = sub + shipping

  const validate = (): boolean => {
    const e: Partial<ShippingAddress> = {}
    const required: Array<keyof ShippingAddress> = [
      "fullName", "address", "city", "state", "zipCode", "country", "phone",
    ]
    required.forEach((field) => {
      if (!shippingAddress[field]?.trim()) {
        e[field] = "Required"
      }
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place an order")
      router.push("/login")
      return
    }
    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }
    if (!validate()) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      const order = await createOrder({
        items: items.map((item) => ({
          product: item.product._id,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.product.price,
        })),
        shippingAddress,
        subtotal: sub,
        shippingCost: shipping,
        total,
      })

      clearCart()
      setOrderId(order._id)
      setPlaced(true)
      toast.success("Order placed successfully! 🎉")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const field = (
    id: keyof ShippingAddress,
    label: string,
    placeholder: string,
    type = "text"
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium uppercase tracking-[0.15em] text-black">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={shippingAddress[id]}
        onChange={(e) =>
          setShippingAddress((a) => ({ ...a, [id]: e.target.value }))
        }
        placeholder={placeholder}
        className={`input-field ${errors[id] ? "border-red-400" : ""}`}
      />
      {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
    </div>
  )

  if (placed && orderId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
        <div>
          <h1 className="font-serif text-4xl font-medium text-black">Order Confirmed</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Order #{orderId.slice(-8).toUpperCase()} has been placed successfully.
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            You will receive a confirmation email shortly.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/account" className="btn-primary">View Orders</Link>
          <Link href="/products" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-12">
      <Link
        href="/cart"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="mb-12 font-serif text-4xl font-medium text-black">Checkout</h1>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        {/* ─── Shipping Form ─── */}
        <div>
          <h2 className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-black">
            Shipping Address
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("fullName", "Full Name", "Jane Smith")}</div>
            <div className="sm:col-span-2">{field("address", "Street Address", "123 Fashion Ave, Apt 4B")}</div>
            {field("city", "City", "New York")}
            {field("state", "State / Province", "NY")}
            {field("zipCode", "ZIP / Postal Code", "10001")}
            {field("country", "Country", "United States")}
            <div className="sm:col-span-2">{field("phone", "Phone Number", "+1 234 567 8900", "tel")}</div>
          </div>
        </div>

        {/* ─── Order Summary ─── */}
        <div className="h-fit border border-neutral-200 p-6 lg:sticky lg:top-28">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-black">
            Order Summary
          </h2>

          {/* Items */}
          <div className="mb-4 space-y-3">
            {items.map((item) => (
              <div
                key={`${item.product._id}-${item.size}-${item.color}`}
                className="flex justify-between gap-4 text-sm"
              >
                <span className="text-neutral-600 truncate">
                  {item.product.name}{" "}
                  <span className="text-neutral-400">×{item.quantity}</span>
                </span>
                <span className="flex-shrink-0 font-medium text-black">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="divider mb-4" />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span>${sub.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Shipping</span>
              <span className={shipping === 0 ? "text-emerald-600 font-medium" : ""}>
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="divider" />
            <div className="flex justify-between text-base font-medium text-black">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading || items.length === 0}
            className="btn-primary mt-6 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Placing Order…
              </>
            ) : (
              `Place Order — $${total.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
