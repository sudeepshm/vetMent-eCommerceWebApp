/**
 * email.service.js
 *
 * Email notification service — Resend-ready stub.
 * Currently logs emails to console so the app works without an email API key.
 * Replace the stub functions with real Resend (or SendGrid) SDK calls when ready.
 *
 * To activate Resend:
 *   1. npm install resend
 *   2. Add RESEND_API_KEY and FROM_EMAIL to backend/.env
 *   3. Uncomment the Resend initialization below
 */

// const { Resend } = require("resend")
// const resend = new Resend(process.env.RESEND_API_KEY)
// const FROM_EMAIL = process.env.FROM_EMAIL || "orders@vetement.com"

/**
 * Send order confirmation email to the customer.
 *
 * @param {{ name: string, email: string }} user
 * @param {{ _id: string, total: number, items: Array }} order
 */
async function sendOrderConfirmation(user, order) {
  const subject = `Order Confirmed — #${String(order._id).slice(-8).toUpperCase()}`
  const body = `
    Hi ${user.name},

    Thank you for your order! Here's your summary:
    
    Order ID: #${String(order._id).slice(-8).toUpperCase()}
    Total: $${order.total.toFixed(2)}
    Items: ${order.items.length} item(s)
    
    We'll notify you when your order ships.
    
    — The VÊTEMENT Team
  `

  // ── STUB: log to console instead of sending ──
  console.log(`[EmailService] Sending order confirmation to ${user.email}`)
  console.log(`[EmailService] Subject: ${subject}`)
  console.log(`[EmailService] Body:\n${body}`)

  // ── REAL RESEND IMPLEMENTATION (uncomment when ready) ──
  // await resend.emails.send({
  //   from: FROM_EMAIL,
  //   to: user.email,
  //   subject,
  //   text: body,
  // })

  return { sent: true, to: user.email }
}

/**
 * Send a welcome email after registration.
 *
 * @param {{ name: string, email: string }} user
 */
async function sendWelcomeEmail(user) {
  console.log(`[EmailService] Sending welcome email to ${user.email}`)
  // Replace with real email send
  return { sent: true, to: user.email }
}

/**
 * Send a shipping notification.
 *
 * @param {{ name: string, email: string }} user
 * @param {string} orderId
 * @param {string} trackingNumber
 */
async function sendShippingNotification(user, orderId, trackingNumber) {
  console.log(
    `[EmailService] Sending shipping notification to ${user.email} — tracking: ${trackingNumber}`
  )
  return { sent: true, to: user.email }
}

module.exports = { sendOrderConfirmation, sendWelcomeEmail, sendShippingNotification }
