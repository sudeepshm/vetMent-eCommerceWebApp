const Order = require("../models/Order")
const User = require("../models/User")
const { sendOrderConfirmation } = require("../services/email.service")

// POST /api/orders
exports.createOrder = async (req, res) => {
  const { items, shippingAddress, subtotal, shippingCost, total } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "Order must have items" })
  }

  const order = await Order.create({
    user: req.user.id,
    items,
    shippingAddress,
    subtotal,
    shippingCost: shippingCost ?? 0,
    total,
    status: "pending",
    paymentStatus: "pending",
  })

  const populated = await Order.findById(order._id).populate("items.product", "name image price")

  // Send confirmation email (non-blocking — don't fail order if email fails)
  try {
    const user = await User.findById(req.user.id)
    if (user) {
      await sendOrderConfirmation(user, populated)
    }
  } catch (emailErr) {
    console.error("[Order] Email notification failed:", emailErr.message)
  }

  res.status(201).json({ success: true, order: populated })
}


// GET /api/orders/my-orders
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("items.product", "name image price")
    .lean()

  res.status(200).json({ success: true, orders })
}

// GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("items.product", "name image price")
    .lean()

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" })
  }

  // Users can only view their own orders; admins can view all
  if (
    String(order.user) !== String(req.user.id) &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ success: false, message: "Forbidden" })
  }

  res.status(200).json({ success: true, order })
}

// GET /api/orders/admin/all (admin)
exports.getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate("items.product", "name image price")
    .lean()

  res.status(200).json({ success: true, orders })
}

// PATCH /api/orders/:id/status (admin)
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
