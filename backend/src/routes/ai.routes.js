const express = require("express")
const router = express.Router()
const {
  submitTryOn,
  submitTryOnJob,
  getTryOnJobStatus,
  getMyTryOns,
} = require("../controllers/ai.controller")
const { chat, getHistory, clearHistory } = require("../controllers/advisor.controller")
const { protect, optionalAuth } = require("../middleware/auth.middleware")

// ── Virtual Try-On Asynchronous Modern Routes ──
// Submit job (protect or optionalAuth if user is authenticated)
router.post("/tryon/submit", protect, submitTryOnJob)
router.post("/v1/try-on/submit", protect, submitTryOnJob)

// Status polling by unique UUID (accessible with jobId)
router.get("/tryon/status/:jobId", getTryOnJobStatus)
router.get("/v1/try-on/status/:jobId", getTryOnJobStatus)

// ── Legacy Synchronous Try-On Route ──
router.post("/tryon", protect, submitTryOn)

// ── User's Saved Try-On Records ──
router.get("/my-tryons", protect, getMyTryOns)

// ── Style Advisor ──
router.post("/advisor", protect, chat)
router.get("/advisor/history", protect, getHistory)
router.delete("/advisor/history", protect, clearHistory)

module.exports = router
