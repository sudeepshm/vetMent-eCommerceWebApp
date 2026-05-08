/**
 * emailTemplates.js
 *
 * VÊTEMENT — branded HTML email templates.
 * Dark luxury aesthetic: black header, clean white body, subtle monospaced details.
 * Uses Google Fonts (Playfair Display + Inter) via @import for email clients that support it.
 */

// ── Shared brand header ──────────────────────────────────────────────────────
function brandHeader() {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;margin-bottom:0;">
      <tr>
        <td align="center" style="padding:32px 24px 28px;">
          <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:26px;font-weight:700;letter-spacing:0.25em;color:#fff;text-transform:uppercase;">
            VÊTEMENT
          </p>
          <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.3em;color:#888;text-transform:uppercase;">
            AI-Powered Fashion
          </p>
        </td>
      </tr>
    </table>`
}

// ── Shared brand footer ──────────────────────────────────────────────────────
function brandFooter() {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e5e5;margin-top:40px;">
      <tr>
        <td align="center" style="padding:28px 24px;">
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;color:#999;letter-spacing:0.08em;text-transform:uppercase;">
            VÊTEMENT · AI-Powered Fashion
          </p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#bbb;">
            You received this email because you have an account with VÊTEMENT.
          </p>
        </td>
      </tr>
    </table>`
}

// ── Wrapper shell ─────────────────────────────────────────────────────────────
function wrapHTML(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');
    body { margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif; }
    a { color:#000;text-decoration:underline; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;width:100%;">
          ${brandHeader()}
          <tr>
            <td style="padding:40px 40px 32px;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;">
              ${brandFooter()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Template 1: Order Confirmation ───────────────────────────────────────────
function orderConfirmationHTML(user, order) {
  const orderId = String(order._id).slice(-8).toUpperCase()
  const itemRows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;color:#333;">
          ${item.product?.name || "Item"} 
          <span style="color:#999;font-size:11px;">× ${item.quantity} / ${item.size}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-family:Arial,sans-serif;font-size:13px;color:#333;white-space:nowrap;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join("")

  const body = `
    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#111;font-weight:700;">
      Order Confirmed
    </p>
    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:13px;color:#666;">
      Hi ${user.name}, thank you for your order. We're getting it ready for you.
    </p>

    <!-- Order ID badge -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;margin-bottom:28px;">
      <tr>
        <td style="padding:14px 20px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;color:#888;text-transform:uppercase;">Order ID</p>
          <p style="margin:4px 0 0;font-family:'Courier New',monospace;font-size:18px;color:#fff;letter-spacing:0.1em;">#${orderId}</p>
        </td>
        <td style="padding:14px 20px;text-align:right;">
          <span style="display:inline-block;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;padding:5px 12px;">
            ${order.paymentStatus === "paid" ? "PAID" : "PENDING PAYMENT"}
          </span>
        </td>
      </tr>
    </table>

    <!-- Items -->
    <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;color:#999;text-transform:uppercase;">Items</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
      <tr>
        <td style="padding:12px 0;font-family:Arial,sans-serif;font-size:12px;color:#999;">Subtotal</td>
        <td style="padding:12px 0;text-align:right;font-family:Arial,sans-serif;font-size:12px;color:#999;">$${(order.subtotal ?? order.total).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:12px;color:#999;">Shipping</td>
        <td style="padding:4px 0;text-align:right;font-family:Arial,sans-serif;font-size:12px;color:#999;">${order.shippingCost === 0 ? "Free" : "$" + order.shippingCost.toFixed(2)}</td>
      </tr>
      <tr style="border-top:2px solid #000;">
        <td style="padding:16px 0 0;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#111;">Total</td>
        <td style="padding:16px 0 0;text-align:right;font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:700;color:#111;">$${order.total.toFixed(2)}</td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
      <tr>
        <td>
          <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:13px;color:#555;line-height:1.6;">
            We'll send you a shipping notification once your order is on its way.
          </p>
        </td>
      </tr>
    </table>`

  return wrapHTML(`Order Confirmed — #${orderId} | VÊTEMENT`, body)
}

// ── Template 2: Welcome Email ─────────────────────────────────────────────────
function welcomeEmailHTML(user) {
  const body = `
    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#111;font-weight:700;">
      Welcome to VÊTEMENT
    </p>
    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:13px;color:#666;">
      Hi ${user.name}, your account has been created. You now have access to our full catalog, 
      AI style advisor, and virtual try-on experience.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-left:3px solid #000;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.15em;color:#999;text-transform:uppercase;">What's waiting for you</p>
          <ul style="margin:8px 0 0;padding-left:18px;font-family:Arial,sans-serif;font-size:13px;color:#444;line-height:1.8;">
            <li>Curated luxury fashion catalog</li>
            <li>AI-powered style advisor (Gemini)</li>
            <li>Virtual try-on powered by computer vision</li>
            <li>Saved order history &amp; tracking</li>
          </ul>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td align="center" style="background:#000;padding:14px 36px;">
          <a href="${process.env.CLIENT_URL || "http://localhost:3000"}" 
             style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.15em;color:#fff;text-decoration:none;text-transform:uppercase;">
            Shop Now
          </a>
        </td>
      </tr>
    </table>`

  return wrapHTML("Welcome to VÊTEMENT", body)
}

// ── Template 3: Shipping Notification ────────────────────────────────────────
function shippingNotificationHTML(user, orderId, trackingNumber) {
  const shortId = String(orderId).slice(-8).toUpperCase()
  const body = `
    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#111;font-weight:700;">
      Your Order Has Shipped
    </p>
    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:13px;color:#666;">
      Hi ${user.name}, great news — your order is on its way.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;color:#888;text-transform:uppercase;">Order</p>
          <p style="margin:0 0 16px;font-family:'Courier New',monospace;font-size:16px;color:#fff;">#${shortId}</p>
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;color:#888;text-transform:uppercase;">Tracking Number</p>
          <p style="margin:0;font-family:'Courier New',monospace;font-size:20px;color:#fff;letter-spacing:0.08em;">${trackingNumber}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#555;line-height:1.6;">
      You can track your shipment using the tracking number above. Estimated delivery is 3–5 business days.
      If you have any questions, simply reply to this email.
    </p>`

  return wrapHTML(`Your Order #${shortId} Has Shipped | VÊTEMENT`, body)
}

module.exports = { orderConfirmationHTML, welcomeEmailHTML, shippingNotificationHTML }
