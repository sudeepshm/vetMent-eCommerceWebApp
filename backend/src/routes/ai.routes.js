const express = require("express")
const router = express.Router()
const { submitTryOn, getMyTryOns } = require("../controllers/ai.controller")
const { protect } = require("../middleware/auth.middleware")

router.use(protect) // All AI routes require auth

router.post("/tryon", submitTryOn)
router.get("/my-tryons", getMyTryOns)

module.exports = router
