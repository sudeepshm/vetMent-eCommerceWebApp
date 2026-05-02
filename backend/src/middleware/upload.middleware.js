/**
 * upload.middleware.js
 *
 * Multer middleware for handling image file uploads.
 * Uses memory storage so files can be streamed directly to Cloudinary
 * without writing to disk.
 */

const multer = require("multer")

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

const storage = multer.memoryStorage()

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`))
  }
}

/** Single image upload — field name: "image" */
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single("image")

/** Multiple images upload — field name: "images", max 5 files */
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).array("images", 5)

/** User photo upload — field name: "userImage" (for try-on) */
const uploadUserImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single("userImage")

/**
 * Wraps a multer middleware in a promise so async/await works cleanly.
 * @param {Function} multerFn
 */
const wrapMulter = (multerFn) => (req, res) =>
  new Promise((resolve, reject) => {
    multerFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        reject(Object.assign(new Error(err.message), { statusCode: 400 }))
      } else if (err) {
        reject(Object.assign(err, { statusCode: 400 }))
      } else {
        resolve()
      }
    })
  })

module.exports = { uploadSingle, uploadMultiple, uploadUserImage, wrapMulter }
