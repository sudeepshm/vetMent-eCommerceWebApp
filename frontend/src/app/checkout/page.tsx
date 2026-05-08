"use client"

/**
 * CheckoutPage
 *
 * Two-step Stripe payment flow:
 *  Step 1: Shipping address form
 *  Step 2: Payment via Stripe CardElement
 *
 * Flow:
 *  1. User fills shipping address → clicks "Continue to Payment"
 *  2. Backend creates order + Stripe PaymentIntent → returns clientSecret
 *  3. Stripe CardElement collects card → stripe.confirmCardPayment(clientSecret)
 *  4. On Stripe success → call backend /confirm-payment → order marked paid
 *  5. Redirect to success screen, cart cleared, confirmation email sent
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle, Lock, CreditCard } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { useCartStore } from "@/store/cartStore"
import { useAuthStore } from "@/store/authStore"
import { createOrder, confirmOrderPayment } from "@/lib/api"
import type { ShippingAddress } from "@/types"
import toast from "react-hot-toast"

// ── Stripe setup ──────────────────────────────────────────────────────────────
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
const stripePromise = stripePublishableKey.startsWith("pk_")
  ? loadStripe(stripePublishableKey)
  : null

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

// ── CardElement style to match VÊTEMENT brand ─────────────────────────────────
const CARD_ELEMENT_STYLE = {
  style: {
    base: {
      fontFamily: "'Inter', Arial, sans-serif",
      fontSize: "14px",
      color: "#111",
      letterSpacing: "0.02em",
      "::placeholder": { color: "#aaa" },
    },
    invalid: { color: "#e53e3e" },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner checkout form (must be inside <Elements> for useStripe hook)
// ─────────────────────────────────────────────────────────────────────────────
function CheckoutForm() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const stripe = useStripe()
  const elements = useElements()

  const [step, setStep] = useState<"shipping" | "payment">("shipping")
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(INITIAL_ADDRESS)
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({})
  const [loading, setLoading] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [cardError, setCardError] = useState<string | null>(null)

  const sub = subtotal()
  const shipping = sub >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = sub + shipping

  // ── Validation ──
  const validate = (): boolean => {
    const e: Partial<ShippingAddress> = {}
    const required: Array<keyof ShippingAddress> = [
      "fullName", "address", "city", "state", "zipCode", "country", "phone",
    ]
    required.forEach((f) => {
      if (!shippingAddress[f]?.trim()) e[f] = "Required"
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Step 1: Submit shipping → create order + PaymentIntent ──
  const handleContinueToPayment = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place an order")
      router.push("/login")
      return
    }
    if (items.length === 0) { toast.error("Your cart is empty"); return }
    if (!validate()) { toast.error("Please fill in all required fields"); return }

    try {
      setLoading(true)
      const { order, clientSecret: cs } = await createOrder({
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

      setClientSecret(cs)
      setPendingOrderId(order._id)

      // If Stripe isn't configured (no key) — skip payment step and confirm directly
      if (!stripePromise || cs.includes("mock")) {
        await confirmOrderPayment(order._id)
        clearCart()
        setOrderId(order._id)
        setPlaced(true)
        toast.success("Order placed successfully! 🎉")
        return
      }

      setStep("payment")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create order")
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Confirm payment with Stripe ──
  const handlePayNow = async () => {
    if (!stripe || !elements || !clientSecret || !pendingOrderId) return

    const card = elements.getElement(CardElement)
    if (!card) return

    setLoading(true)
    setCardError(null)

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      })

      if (error) {
        setCardError(error.message ?? "Payment failed")
        toast.error(error.message ?? "Payment failed")
        setLoading(false)
        return
      }

      if (paymentIntent?.status === "succeeded") {
        // Tell backend to mark order as paid
        await confirmOrderPayment(pendingOrderId)
        clearCart()
        setOrderId(pendingOrderId)
        setPlaced(true)
        toast.success("Payment successful! 🎉")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment error")
    } finally {
      setLoading(false)
    }
  }

  // ── Field helper ──
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
        onChange={(e) => setShippingAddress((a) => ({ ...a, [id]: e.target.value }))}
        placeholder={placeholder}
        className={`input-field ${errors[id] ? "border-red-400" : ""}`}
      />
      {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
    </div>
  )

  // ── Success screen ──
  if (placed && orderId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-serif text-4xl font-medium text-black">Order Confirmed</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Order #{orderId.slice(-8).toUpperCase()} · Payment received
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            A confirmation email has been sent to you.
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

      {/* Step indicator */}
      <div className="mb-10 flex items-center gap-3">
        {(["shipping", "payment"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              step === s ? "bg-black text-white" :
              (i === 1 && step === "payment") ? "bg-black text-white" :
              "border border-neutral-300 text-neutral-400"
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs uppercase tracking-[0.15em] ${step === s ? "text-black font-medium" : "text-neutral-400"}`}>
              {s === "shipping" ? "Shipping" : "Payment"}
            </span>
            {i === 0 && <span className="text-neutral-300 mx-1">→</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">

        {/* ─── Left: Shipping or Payment Form ─── */}
        <div>
          {step === "shipping" && (
            <>
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
              <button
                onClick={handleContinueToPayment}
                disabled={loading || items.length === 0}
                className="btn-primary mt-8 w-full sm:w-auto"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Creating Order…</>
                ) : (
                  `Continue to Payment — $${total.toFixed(2)}`
                )}
              </button>
            </>
          )}

          {step === "payment" && (
            <>
              <h2 className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-black">
                Payment Details
              </h2>

              {/* Shipping summary (read-only) */}
              <div className="mb-6 border border-neutral-100 bg-neutral-50 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
                  Shipping to
                </p>
                <p className="text-sm text-neutral-700">
                  {shippingAddress.fullName} · {shippingAddress.address}, {shippingAddress.city},{" "}
                  {shippingAddress.state} {shippingAddress.zipCode}, {shippingAddress.country}
                </p>
                <button
                  onClick={() => setStep("shipping")}
                  className="mt-2 text-xs text-neutral-400 underline hover:text-black"
                >
                  Edit
                </button>
              </div>

              {/* Stripe Card Element */}
              <div className="space-y-4">
                <div className="border border-neutral-200 p-4 focus-within:border-black transition-colors">
                  <CardElement options={CARD_ELEMENT_STYLE} onChange={() => setCardError(null)} />
                </div>
                {cardError && (
                  <p className="text-xs text-red-500">{cardError}</p>
                )}
                {!stripePromise && (
                  <p className="text-xs text-amber-600 border border-amber-200 bg-amber-50 px-3 py-2">
                    ⚠️ Stripe key not configured — order will be placed in mock mode.
                    Add <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to{" "}
                    <code className="font-mono">frontend/.env.local</code>.
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
                <Lock className="h-3 w-3" />
                Secured by Stripe · Your card details are encrypted and never stored.
              </div>

              {/* Test card hint */}
              {stripePublishableKey.startsWith("pk_test_") && (
                <div className="mt-3 border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <strong>Test mode:</strong> Use card{" "}
                  <code className="font-mono">4242 4242 4242 4242</code> · any future expiry · any CVC
                </div>
              )}

              <button
                onClick={handlePayNow}
                disabled={loading || !stripe}
                className="btn-primary mt-8 w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                ) : (
                  <><CreditCard className="h-4 w-4" />Pay ${total.toFixed(2)}</>
                )}
              </button>
            </>
          )}
        </div>

        {/* ─── Right: Order Summary ─── */}
        <div className="h-fit border border-neutral-200 p-6 lg:sticky lg:top-28">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-black">
            Order Summary
          </h2>

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
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page wrapper — provides Stripe context only when a key is configured
// ─────────────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  // IMPORTANT: <Elements stripe={null}> is invalid and crashes Stripe SDK.
  // When no publishable key is set, render without the Elements wrapper.
  // CheckoutForm detects !stripePromise and routes through mock payment flow.
  if (!stripePromise) {
    return <CheckoutForm />
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}
