const express = require("express")
const router = express.Router()
const { submitTryOn, getMyTryOns } = require("../controllers/ai.controller")
const { chat, getHistory, clearHistory } = require("../controllers/advisor.controller")
const { protect } = require("../middleware/auth.middleware")

// ── All AI routes require authentication ──
router.use(protect)

// Style Advisor (MongoDB-persisted)
router.post("/advisor", chat)
router.get("/advisor/history", getHistory)
router.delete("/advisor/history", clearHistory)

// Virtual Try-On
router.post("/tryon", submitTryOn)
router.get("/my-tryons", getMyTryOns)

module.exports = router
