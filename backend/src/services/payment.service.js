/**
 * payment.service.js
 *
 * Live Stripe payment integration.
 * Requires STRIPE_SECRET_KEY in backend/.env
 *
 * Gracefully falls back to mock mode if the key is missing (dev only).
 */

let stripe = null

if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require("stripe")
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
} else {
  console.warn("[PaymentService] ⚠️  STRIPE_SECRET_KEY not set — running in mock mode")
}

/**
 * Create a Stripe Payment Intent for the given USD amount.
 *
 * @param {number} amountUSD  - Total in dollars (e.g. 149.99)
 * @param {string} currency   - Currency code (default: "usd")
 * @param {Object} metadata   - Optional metadata attached to the intent (e.g. orderId)
 * @returns {Promise<{ clientSecret: string, paymentIntentId: string }>}
 */
async function createPaymentIntent(amountUSD, currency = "usd", metadata = {}) {
  if (!stripe) {
    // ── Mock mode (no Stripe key) ──
    const mockId = `pi_mock_${Date.now()}`
    return { clientSecret: `${mockId}_secret_mock`, paymentIntentId: mockId }
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amountUSD * 100), // Stripe works in cents
    currency,
    automatic_payment_methods: { enabled: true },
    metadata,
  })

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id }
}

/**
 * Retrieve a PaymentIntent and return its status.
 *
 * @param {string} paymentIntentId
 * @returns {Promise<{ success: boolean, status: string }>}
 */
async function confirmPayment(paymentIntentId) {
  if (!stripe || paymentIntentId.startsWith("pi_mock_")) {
    return { success: true, status: "succeeded" }
  }

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  return { success: intent.status === "succeeded", status: intent.status }
}

/**
 * Issue a full refund for a given PaymentIntent.
 *
 * @param {string} paymentIntentId
 * @returns {Promise<{ success: boolean }>}
 */
async function refundPayment(paymentIntentId) {
  if (!stripe || paymentIntentId.startsWith("pi_mock_")) {
    console.log(`[PaymentService] Mock refund for ${paymentIntentId}`)
    return { success: true }
  }

  await stripe.refunds.create({ payment_intent: paymentIntentId })
  return { success: true }
}

/**
 * Verify and construct a Stripe webhook event from a raw request body.
 *
 * @param {Buffer}  rawBody   - Raw request body buffer (must NOT be parsed by express.json)
 * @param {string}  signature - Value of the `stripe-signature` header
 * @returns {import("stripe").Stripe.Event}
 */
function constructWebhookEvent(rawBody, signature) {
  if (!stripe) throw new Error("Stripe not initialized — STRIPE_SECRET_KEY missing")
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )
}

module.exports = { createPaymentIntent, confirmPayment, refundPayment, constructWebhookEvent }
