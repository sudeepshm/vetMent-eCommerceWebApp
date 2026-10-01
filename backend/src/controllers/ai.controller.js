const multer = require("multer")
const cloudinary = require("../config/cloudinary")
const TryOn = require("../models/TryOn")
const Product = require("../models/Product")
const { generateTryOn } = require("../services/ai.service")
const { createJob, updateJob, getJob, dispatchJob } = require("../services/jobQueue.service")

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

// Helper: upload buffer to Cloudinary (or fallback to base64 data URI)
const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      const base64 = buffer.toString("base64")
      return resolve(`data:image/jpeg;base64,${base64}`)
    }
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

/**
 * POST /api/ai/tryon/submit  (and /api/v1/try-on/submit)
 * Asynchronous job submission route. Returns HTTP 202 Accepted immediately.
 */
exports.submitTryOnJob = [
  upload.single("userImage"),
  async (req, res) => {
    const { productId, garmentImageUrl, user_height_cm, num_inference_steps, category } = req.body
    let userImageUrl = req.body.userImageUrl || req.body.user_image_url

    if (!req.file && !userImageUrl) {
      return res.status(400).json({ success: false, message: "User image is required" })
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" })
    }

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" })
    }

    // 1. Upload buffer if file was sent
    if (req.file) {
      userImageUrl = await uploadBufferToCloudinary(
        req.file.buffer,
        "fashion/tryon/user-uploads"
      )
    }

    const garmentUrl = garmentImageUrl || product.imageBgRemoved || product.image
    const options = {
      user_height_cm: Number(user_height_cm) || 175,
      num_inference_steps: Number(num_inference_steps) || 25,
      category: category || "upper_body",
    }

    // 2. Create job in queue
    const job = createJob({
      userId: req.user ? req.user.id : null,
      productId,
      userImageUrl,
      garmentImageUrl: garmentUrl,
      options,
    })

    // 3. Dispatch background task decoupled from request thread
    dispatchJob(job.jobId, async (updateProgress) => {
      updateProgress("PREPROCESSING", 25)
      const startTime = Date.now()

      updateProgress("INFERENCE", 50)
      const aiResult = await generateTryOn(userImageUrl, garmentUrl, options)
      const processingTime = Date.now() - startTime

      updateProgress("POSTPROCESSING", 90)

      // Persist TryOn record to database
      if (req.user && req.user.id) {
        try {
          await TryOn.create({
            user: req.user.id,
            product: productId,
            userImageUrl,
            resultImageUrl: aiResult.result_url,
            processingTime,
            jobId: job.jobId,
            userHeightCm: options.user_height_cm,
            sizingAdvisory: aiResult.sizing_advisory || null,
            telemetry: aiResult.telemetry || null,
          })
        } catch (dbErr) {
          console.error("[TryOn DB Save Error]", dbErr.message)
        }
      }

      return aiResult
    })

    // 4. Return HTTP 202 Accepted immediately
    res.status(202).json({
      status: "QUEUED",
      job_id: job.jobId,
      estimated_wait_seconds: 5.5,
      status_endpoint: `/api/ai/tryon/status/${job.jobId}`,
    })
  },
]

/**
 * GET /api/ai/tryon/status/:jobId (and /api/v1/try-on/status/:jobId)
 * Non-blocking job polling endpoint.
 */
exports.getTryOnJobStatus = async (req, res) => {
  const { jobId } = req.params
  const job = getJob(jobId)

  if (!job) {
    return res.status(404).json({ success: false, message: "Try-on job not found or expired" })
  }

  res.status(200).json(job)
}

/**
 * Legacy POST /api/ai/tryon
 * Synchronous route maintained for backward compatibility.
 */
exports.submitTryOn = [
  upload.single("userImage"),
  async (req, res) => {
    const { productId, garmentImageUrl, user_height_cm } = req.body

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
    const garmentUrl = garmentImageUrl || product.imageBgRemoved || product.image
    let resultImageUrl
    let sizingAdvisory = null
    let telemetry = null

    try {
      const aiResult = await generateTryOn(userImageUrl, garmentUrl, {
        user_height_cm: Number(user_height_cm) || 175,
      })
      resultImageUrl = aiResult.result_url
      sizingAdvisory = aiResult.sizing_advisory
      telemetry = aiResult.telemetry
    } catch (aiErr) {
      console.error("[AI Service Error]", aiErr.message)
      resultImageUrl = garmentUrl
    }

    const processingTime = Date.now() - start

    // 3. Save to database
    const tryOn = await TryOn.create({
      user: req.user.id,
      product: productId,
      userImageUrl,
      resultImageUrl,
      processingTime,
      sizingAdvisory,
      telemetry,
    })

    const populated = await TryOn.findById(tryOn._id).populate("product", "name image price")

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
