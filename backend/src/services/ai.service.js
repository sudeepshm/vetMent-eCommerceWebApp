/**
 * ai.service.js
 *
 * Backend service layer communicating with the Python FastAPI AI service
 * or Google Colab Cloudflare tunnel. Handles image URLs, anthropometric sizing,
 * and result parsing.
 */

const axios = require("axios")

// Prioritize remote Colab worker if configured, otherwise local AI service
const AI_SERVICE_URL = process.env.AI_WORKER_URL || process.env.AI_SERVICE_URL || "http://localhost:8000"
const AI_TIMEOUT_MS = 120_000 // 120 seconds timeout for diffusion processing

/**
 * Send garment + user image URLs to the AI service and get a try-on result.
 *
 * @param {string} userImageUrl   - Cloudinary URL of the user's uploaded photo
 * @param {string} garmentImageUrl - Cloudinary/CDN URL of the garment image
 * @param {object} options         - Optional options (user_height_cm, num_inference_steps, etc.)
 * @returns {Promise<{ result_url: string, processing_time_ms: number, sizing_advisory?: object, telemetry?: object }>}
 */
async function generateTryOn(userImageUrl, garmentImageUrl, options = {}) {
  const formData = new URLSearchParams()
  formData.append("user_image_url", userImageUrl)
  formData.append("garment_image_url", garmentImageUrl)
  if (options.user_height_cm) {
    formData.append("user_height_cm", String(options.user_height_cm))
  }
  if (options.num_inference_steps) {
    formData.append("num_inference_steps", String(options.num_inference_steps))
  }

  const response = await axios.post(`${AI_SERVICE_URL}/tryon`, formData.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: AI_TIMEOUT_MS,
  })

  return response.data
}

/**
 * Check if the AI service / Colab worker is available.
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

module.exports = { generateTryOn, isAIServiceHealthy, AI_SERVICE_URL }

