require("dotenv").config()
require("express-async-errors")
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const connectDB = require("./config/db")

// Route imports
const authRoutes = require("./routes/auth.routes")
const productRoutes = require("./routes/product.routes")
const orderRoutes = require("./routes/order.routes")
const aiRoutes = require("./routes/ai.routes")
const webhookRoutes = require("./routes/webhook.routes")

// Connect to MongoDB
connectDB()

const app = express()

// ── Security Middleware ──
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
)
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3000",
]
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origin '${origin}' not allowed`))
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
)

// ── IMPORTANT: Webhook route MUST come before express.json() ──
// Stripe requires the raw Buffer body for signature verification.
app.use("/api/webhooks", webhookRoutes)

// ── Body Parsing Middleware (after webhooks) ──
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"))
}

// ── Health Check ──
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    emailConfigured: !!process.env.RESEND_API_KEY,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  })
})

// ── API Routes ──
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api", aiRoutes)

// ── 404 Handler ──
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" })
})

// ── Global Error Handler ──
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(`[ERROR] ${err.message}`)
  const status = err.statusCode || err.status || 500
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? "✅ configured" : "⚠️  mock mode"}`)
  console.log(`📧 Email:  ${process.env.RESEND_API_KEY ? "✅ configured" : "⚠️  mock mode"}`)
  console.log(`🤖 Gemini: ${process.env.GEMINI_API_KEY ? "✅ configured" : "⚠️  not set"}`)
})

module.exports = app
