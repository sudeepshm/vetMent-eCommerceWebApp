"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { clsx } from "clsx"

const SHIPPING_THRESHOLD = 150
const SHIPPING_COST = 12.99

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore()
  const sub = subtotal()
  const shipping = sub >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = sub + shipping

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6">
        <ShoppingBag className="h-16 w-16 text-neutral-300" strokeWidth={1} />
        <div className="text-center">
          <h1 className="font-serif text-3xl font-medium text-black">
            Your cart is empty
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Add some pieces to get started.
          </p>
        </div>
        <Link href="/products" className="btn-primary mt-2">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-12">
      <h1 className="mb-12 font-serif text-4xl font-medium text-black">
        Shopping Cart
        <span className="ml-3 font-sans text-xl font-light text-neutral-400">
          ({items.length})
        </span>
      </h1>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        {/* ─── Cart Items ─── */}
        <div className="space-y-0 divide-y divide-neutral-200">
          {items.map((item) => (
            <div
              key={`${item.product._id}-${item.size}-${item.color}`}
              className="flex gap-5 py-6"
            >
              <Link href={`/product/${item.product._id}`}>
                <div className="relative h-36 w-24 flex-shrink-0 overflow-hidden bg-neutral-100">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/product/${item.product._id}`}
                      className="text-sm font-medium text-black hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-500">
                      Size: {item.size} · Color: {item.color}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      removeItem(item.product._id, item.size, item.color)
                    }
                    className="flex-shrink-0 text-neutral-400 transition hover:text-black"
                    aria-label="Remove item"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {/* Qty Control */}
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product._id,
                          item.size,
                          item.color,
                          item.quantity - 1
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center border border-neutral-300 text-xs transition hover:border-black"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex h-8 w-8 items-center justify-center border-y border-neutral-300 text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product._id,
                          item.size,
                          item.color,
                          item.quantity + 1
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center border border-neutral-300 text-xs transition hover:border-black"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="text-sm font-medium text-black">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Order Summary ─── */}
        <div className="h-fit border border-neutral-200 p-6 lg:sticky lg:top-28">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-black">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span>${sub.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Shipping</span>
              <span
                className={clsx(
                  shipping === 0 ? "font-medium text-emerald-600" : "text-neutral-700"
                )}
              >
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </span>
            </div>

            {sub < SHIPPING_THRESHOLD && (
              <p className="text-xs text-neutral-500">
                Add ${(SHIPPING_THRESHOLD - sub).toFixed(2)} more for free shipping
              </p>
            )}

            <div className="divider !my-4" />

            <div className="flex justify-between text-base font-medium text-black">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/products"
            className="mt-4 block text-center text-xs text-neutral-500 underline underline-offset-2 transition hover:text-black"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
