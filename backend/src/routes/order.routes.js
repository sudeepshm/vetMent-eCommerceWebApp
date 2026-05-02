const express = require("express")
const router = express.Router()
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/order.controller")
const { protect, adminOnly } = require("../middleware/auth.middleware")

router.use(protect) // All order routes require auth

router.post("/", createOrder)
router.get("/my-orders", getMyOrders)
router.get("/admin/all", adminOnly, getAllOrders)
router.get("/:id", getOrderById)
router.patch("/:id/status", adminOnly, updateOrderStatus)

module.exports = router
