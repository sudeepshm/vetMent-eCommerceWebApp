const Order = require("../models/Order")
const User = require("../models/User")
const { sendOrderConfirmation } = require("../services/email.service")
const { createPaymentIntent, confirmPayment } = require("../services/payment.service")

// ─────────────────────────────────────────────
// POST /api/orders
// Creates the order record + Stripe PaymentIntent.
// Returns clientSecret so the frontend can complete payment.
// ─────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  const { items, shippingAddress, subtotal, shippingCost, total } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "Order must have items" })
  }

  // 1. Create Stripe PaymentIntent first
  const { clientSecret, paymentIntentId } = await createPaymentIntent(total, "usd", {
    userId: String(req.user.id),
  })

  // 2. Persist order with paymentIntentId linked
  const order = await Order.create({
    user: req.user.id,
    items,
    shippingAddress,
    subtotal,
    shippingCost: shippingCost ?? 0,
    total,
    status: "pending",
    paymentStatus: "pending",
    paymentIntentId,
  })

  const populated = await Order.findById(order._id).populate("items.product", "name image price")

  res.status(201).json({ success: true, order: populated, clientSecret })
}

// ─────────────────────────────────────────────
// POST /api/orders/:id/confirm-payment
// Called by frontend after stripe.confirmCardPayment() succeeds.
// Verifies intent status with Stripe and marks order as paid.
// ─────────────────────────────────────────────
exports.confirmOrderPayment = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product", "name image price")

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" })
  }

  // Ensure requesting user owns this order
  if (String(order.user) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" })
  }

  if (order.paymentStatus === "paid") {
    return res.status(200).json({ success: true, order })
  }

  const { success, status } = await confirmPayment(order.paymentIntentId)

  if (!success) {
    order.paymentStatus = "failed"
    await order.save()
    return res.status(402).json({ success: false, message: `Payment ${status}`, order })
  }

  order.paymentStatus = "paid"
  order.status = "processing"
  await order.save()

  // Send confirmation email (non-blocking)
  try {
    const user = await User.findById(req.user.id)
    if (user) await sendOrderConfirmation(user, order)
  } catch (emailErr) {
    console.error("[Order] Email notification failed:", emailErr.message)
  }

  res.status(200).json({ success: true, order })
}

// ─────────────────────────────────────────────
// GET /api/orders/my-orders
// ─────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("items.product", "name image price")
    .lean()

  res.status(200).json({ success: true, orders })
}

// ─────────────────────────────────────────────
// GET /api/orders/:id
// ─────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("items.product", "name image price")
    .lean()

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" })
  }

  if (String(order.user) !== String(req.user.id) && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" })
  }

  res.status(200).json({ success: true, order })
}

// ─────────────────────────────────────────────
// GET /api/orders/admin/all (admin)
// ─────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate("items.product", "name image price")
    .lean()

  res.status(200).json({ success: true, orders })
}

// ─────────────────────────────────────────────
// PATCH /api/orders/:id/status (admin)
// ─────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body
  const valid = ["pending", "processing", "shipped", "delivered", "cancelled"]

  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value" })
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate("items.product", "name image price")

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" })
  }

  res.status(200).json({ success: true, order })
}
