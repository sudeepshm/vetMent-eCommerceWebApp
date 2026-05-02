/**
 * payment.service.js
 *
 * Payment processing service — Stripe-ready stub.
 * Currently simulates payment success so the checkout flow works end-to-end.
 * Replace the mock functions with real Stripe SDK calls when you have keys.
 *
 * To activate Stripe:
 *   1. npm install stripe
 *   2. Add STRIPE_SECRET_KEY to backend/.env
 *   3. Uncomment the Stripe initialization and replace stubs below
 */

// const Stripe = require("stripe")
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

/**
 * Create a payment intent for a given amount (in USD cents).
 *
 * @param {number} amountUSD - Amount in dollars (e.g. 149.99)
 * @param {string} currency  - Currency code (default: "usd")
 * @returns {Promise<{ clientSecret: string, paymentIntentId: string }>}
 */
async function createPaymentIntent(amountUSD, currency = "usd") {
  // ── STUB: returns a mock payment intent ──
  // Replace this block with the real Stripe call below when ready:
  //
  // const intent = await stripe.paymentIntents.create({
  //   amount: Math.round(amountUSD * 100),
  //   currency,
  //   automatic_payment_methods: { enabled: true },
  // })
  // return { clientSecret: intent.client_secret, paymentIntentId: intent.id }

  const mockIntentId = `pi_mock_${Date.now()}`
  return {
    clientSecret: `${mockIntentId}_secret_mock`,
    paymentIntentId: mockIntentId,
  }
}

/**
 * Confirm a payment and return success/failure.
 *
 * @param {string} paymentIntentId
 * @returns {Promise<{ success: boolean, status: string }>}
 */
async function confirmPayment(paymentIntentId) {
  // ── STUB: always returns success ──
  // Replace with: const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  //              return { success: intent.status === "succeeded", status: intent.status }
  return { success: true, status: "succeeded" }
}

/**
 * Process a refund for a given payment intent.
 *
 * @param {string} paymentIntentId
 * @returns {Promise<{ success: boolean }>}
 */
async function refundPayment(paymentIntentId) {
  // ── STUB ──
  // Replace with: await stripe.refunds.create({ payment_intent: paymentIntentId })
  console.log(`[PaymentService] Refund stub called for ${paymentIntentId}`)
  return { success: true }
}

module.exports = { createPaymentIntent, confirmPayment, refundPayment }
