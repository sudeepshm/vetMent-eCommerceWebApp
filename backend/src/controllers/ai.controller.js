const multer = require("multer")
const axios = require("axios")
const cloudinary = require("../config/cloudinary")
const TryOn = require("../models/TryOn")
const Product = require("../models/Product")

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

// Helper: upload buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err)
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

// POST /api/ai/tryon
exports.submitTryOn = [
  upload.single("userImage"),
  async (req, res) => {
    const { productId, garmentImageUrl } = req.body

    if (!req.file) {
      return res.status(400).json({ success: false, message: "User image is required" })
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" })
    }

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" })
    }

    const start = Date.now()

    // 1. Upload user image to Cloudinary
    const userImageUrl = await uploadBufferToCloudinary(
      req.file.buffer,
      "fashion/tryon/user-uploads"
    )

    // 2. Call AI service
    const aiPayload = new FormData()
    aiPayload.append("user_image_url", userImageUrl)
    aiPayload.append("garment_image_url", garmentImageUrl || product.image)

    let resultImageUrl
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/tryon`,
        aiPayload,
        {
          timeout: 60000, // 60 second timeout
        }
      )
      resultImageUrl = aiResponse.data.result_url
    } catch (aiErr) {
      console.error("[AI Service Error]", aiErr.message)
      // Fallback: return original garment image if AI service is unavailable
      resultImageUrl = garmentImageUrl || product.image
    }

    const processingTime = Date.now() - start

    // 3. Save to database
    const tryOn = await TryOn.create({
      user: req.user.id,
      product: productId,
      userImageUrl,
      resultImageUrl,
      processingTime,
    })

    const populated = await TryOn.findById(tryOn._id)
      .populate("product", "name image price")

    res.status(201).json({ success: true, tryOn: populated })
  },
]

// GET /api/ai/my-tryons
exports.getMyTryOns = async (req, res) => {
  const tryOns = await TryOn.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("product", "name image price")
    .lean()

  res.status(200).json({ success: true, tryOns })
}
