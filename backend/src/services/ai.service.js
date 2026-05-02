/**
 * ai.service.js
 *
 * Backend service layer that communicates with the Python FastAPI AI service.
 * Handles HTTP forwarding of image URLs and result fetching.
 * This keeps controller logic clean and AI logic isolated.
 */

const axios = require("axios")

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000"
const AI_TIMEOUT_MS = 90_000 // 90 seconds for AI processing

/**
 * Send garment + user image URLs to the AI service and get a try-on result.
 *
 * @param {string} userImageUrl   - Cloudinary URL of the user's uploaded photo
 * @param {string} garmentImageUrl - Cloudinary/CDN URL of the garment image
 * @returns {Promise<{ result_url: string, processing_time_ms: number }>}
 */
async function generateTryOn(userImageUrl, garmentImageUrl) {
  const formData = new URLSearchParams()
  formData.append("user_image_url", userImageUrl)
  formData.append("garment_image_url", garmentImageUrl)

  const response = await axios.post(`${AI_SERVICE_URL}/tryon`, formData.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: AI_TIMEOUT_MS,
  })

  return response.data
}

/**
 * Check if the AI service is available.
 * @returns {Promise<boolean>}
 */
async function isAIServiceHealthy() {
  try {
    const res = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 })
    return res.data?.status === "ok"
  } catch {
    return false
  }
}

module.exports = { generateTryOn, isAIServiceHealthy }
