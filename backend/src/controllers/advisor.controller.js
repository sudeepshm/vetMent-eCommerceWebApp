/**
 * advisor.controller.js
 *
 * Handles the Gemini style advisor endpoints.
 * Chat history is persisted per-user in MongoDB (AdvisorSession model).
 *
 * Routes (all protected — JWT required):
 *   POST   /api/ai/advisor          — Send a message, get a reply, save both to DB
 *   GET    /api/ai/advisor/history  — Fetch full message history for current user
 *   DELETE /api/ai/advisor/history  — Clear entire session for current user
 */

const Product = require("../models/Product")
const AdvisorSession = require("../models/AdvisorSession")
const { askStyleAdvisor } = require("../services/gemini.service")

// ─────────────────────────────────────────────
// POST /api/ai/advisor
// ─────────────────────────────────────────────
exports.chat = async (req, res) => {
  const { message, imageBase64, imageMime } = req.body

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: "Message is required" })
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      success: false,
      message: "Style advisor is not configured. Please add GEMINI_API_KEY to environment.",
    })
  }

  // Fetch a lightweight catalog snapshot (id, name, category, price, sizes, tags)
  const catalog = await Product.find({ inStock: true })
    .select("_id name category price sizes tags")
    .limit(100)
    .lean()

  const reply = await askStyleAdvisor(
    message.trim(),
    catalog,
    imageBase64 || null,
    imageMime || null
  )

  // Persist both user message and advisor reply to MongoDB
  const userMessage = {
    role: "user",
    text: message.trim(),
    imagePreview: imageBase64 && imageMime ? `data:${imageMime};base64,${imageBase64}` : null,
    timestamp: new Date(),
  }
  const advisorMessage = {
    role: "advisor",
    text: reply,
    timestamp: new Date(),
  }

  await AdvisorSession.findOneAndUpdate(
    { user: req.user.id },
    {
      $push: {
        messages: {
          $each: [userMessage, advisorMessage],
        },
      },
    },
    { upsert: true, new: true }
  )

  res.status(200).json({ success: true, reply })
}

// ─────────────────────────────────────────────
// GET /api/ai/advisor/history
// ─────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  const session = await AdvisorSession.findOne({ user: req.user.id }).lean()

  if (!session) {
    return res.status(200).json({ success: true, messages: [] })
  }

  res.status(200).json({ success: true, messages: session.messages })
}

// ─────────────────────────────────────────────
// DELETE /api/ai/advisor/history
// ─────────────────────────────────────────────
exports.clearHistory = async (req, res) => {
  await AdvisorSession.findOneAndUpdate(
    { user: req.user.id },
    { $set: { messages: [] } },
    { upsert: false }
  )

  res.status(200).json({ success: true, message: "Conversation cleared" })
}
