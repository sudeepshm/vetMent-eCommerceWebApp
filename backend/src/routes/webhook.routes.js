/**
 * webhook.routes.js
 *
 * Handles inbound Stripe webhook events.
 * IMPORTANT: This route MUST be registered BEFORE express.json() because
 * Stripe signature verification requires the raw request body as a Buffer.
 */

const express = require("express")
const router = express.Router()
const Order = require("../models/Order")
const User = require("../models/User")
const { constructWebhookEvent } = require("../services/payment.service")
const { sendOrderConfirmation } = require("../services/email.service")

// POST /api/webhooks/stripe
// Receives raw body (set up in server.js before express.json middleware)
router.post(
  "/stripe",
  express.raw({ type: "application/json" }), // parse raw buffer for signature verification
  async (req, res) => {
    const signature = req.headers["stripe-signature"]

    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature header" })
    }

    let event
    try {
      event = constructWebhookEvent(req.body, signature)
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err.message)
      return res.status(400).json({ error: `Webhook Error: ${err.message}` })
    }

    console.log(`[Webhook] Received event: ${event.type}`)

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const intent = event.data.object
          const order = await Order.findOne({ paymentIntentId: intent.id })
          if (order && order.paymentStatus !== "paid") {
            order.paymentStatus = "paid"
            order.status = "processing"
            await order.save()

            // Send confirmation email
            const user = await User.findById(order.user)
            if (user) {
              await sendOrderConfirmation(user, order).catch((e) =>
                console.error("[Webhook] Email failed:", e.message)
              )
            }
            console.log(`[Webhook] Order ${order._id} marked as paid`)
          }
          break
        }

        case "payment_intent.payment_failed": {
          const intent = event.data.object
          const order = await Order.findOne({ paymentIntentId: intent.id })
          if (order) {
            order.paymentStatus = "failed"
            await order.save()
            console.log(`[Webhook] Order ${order._id} payment failed`)
          }
          break
        }

        default:
          // Unhandled event type — log and ignore
          console.log(`[Webhook] Unhandled event type: ${event.type}`)
      }
    } catch (handlerErr) {
      console.error("[Webhook] Handler error:", handlerErr.message)
      // Return 200 anyway so Stripe doesn't retry indefinitely
    }

    res.status(200).json({ received: true })
  }
)

module.exports = router
