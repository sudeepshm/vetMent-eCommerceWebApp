/**
 * email.service.js
 *
 * Transactional email service powered by Resend.
 * Sends VÊTEMENT-branded HTML emails for order events.
 *
 * Requires: RESEND_API_KEY + FROM_EMAIL in backend/.env
 * Falls back gracefully (console.log) if keys are missing — app never crashes in dev.
 *
 * Setup:
 *   1. npm install resend  (already done)
 *   2. Add to backend/.env:
 *        RESEND_API_KEY=re_...
 *        FROM_EMAIL=onboarding@resend.dev   (or your verified sender)
 */

const {
  orderConfirmationHTML,
  welcomeEmailHTML,
  shippingNotificationHTML,
} = require("../utils/emailTemplates")

// Lazily initialize Resend only if the key exists
let resend = null
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev"

if (process.env.RESEND_API_KEY) {
  const { Resend } = require("resend")
  resend = new Resend(process.env.RESEND_API_KEY)
} else {
  console.warn("[EmailService] ⚠️  RESEND_API_KEY not set — emails will be logged to console only")
}

/**
 * Internal send helper. Falls back to console.log if Resend isn't configured.
 */
async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log(`[EmailService] MOCK — To: ${to} | Subject: ${subject}`)
    return { sent: false, mock: true, to }
  }

  try {
    const result = await resend.emails.send({
      from: `VÊTEMENT <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })
    console.log(`[EmailService] Sent to ${to} | id: ${result.id}`)
    return { sent: true, id: result.id, to }
  } catch (err) {
    console.error(`[EmailService] Failed to send to ${to}:`, err.message)
    throw err // Let caller decide whether to swallow this
  }
}

/**
 * Send order confirmation email to the customer.
 *
 * @param {{ name: string, email: string }} user
 * @param {{ _id: string, total: number, items: Array, paymentStatus: string }} order
 */
async function sendOrderConfirmation(user, order) {
  const orderId = String(order._id).slice(-8).toUpperCase()
  return sendEmail({
    to: user.email,
    subject: `Order Confirmed — #${orderId} | VÊTEMENT`,
    html: orderConfirmationHTML(user, order),
  })
}

/**
 * Send a welcome email after successful registration.
 *
 * @param {{ name: string, email: string }} user
 */
async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: "Welcome to VÊTEMENT",
    html: welcomeEmailHTML(user),
  })
}

/**
 * Send a shipping notification with tracking number.
 *
 * @param {{ name: string, email: string }} user
 * @param {string} orderId
 * @param {string} trackingNumber
 */
async function sendShippingNotification(user, orderId, trackingNumber) {
  const shortId = String(orderId).slice(-8).toUpperCase()
  return sendEmail({
    to: user.email,
    subject: `Your Order #${shortId} Has Shipped | VÊTEMENT`,
    html: shippingNotificationHTML(user, orderId, trackingNumber),
  })
}

module.exports = { sendOrderConfirmation, sendWelcomeEmail, sendShippingNotification }
