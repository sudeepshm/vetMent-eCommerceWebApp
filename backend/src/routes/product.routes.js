const express = require("express")
const router = express.Router()
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller")
const { protect, adminOnly } = require("../middleware/auth.middleware")
const multer = require("multer")

// Multer — memory storage so files can be streamed to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"]
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only JPEG, PNG, WebP allowed"))
  },
})

// Public
router.get("/", getProducts)
router.get("/:id", getProductById)

// Admin protected — multer parses the multipart form data (text fields + image)
router.post("/", protect, adminOnly, upload.single("image"), createProduct)
router.put("/:id", protect, adminOnly, upload.single("image"), updateProduct)
router.delete("/:id", protect, adminOnly, deleteProduct)

module.exports = router
