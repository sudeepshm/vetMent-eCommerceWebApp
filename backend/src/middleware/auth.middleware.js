const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Verify JWT and attach user to request
exports.protect = async (req, res, next) => {
  let token = null

  // Check Authorization header
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1]
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please sign in.",
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" })
    }

    req.user = user
    next()
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Session expired. Please sign in again." : "Invalid token."
    return res.status(401).json({ success: false, message })
  }
}

// Restrict to admin role only
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    })
  }
  next()
}

// Optional auth: attach user if token is present, but don't fail if not
exports.optionalAuth = async (req, _res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id)
    } catch {
      // Ignore invalid tokens on optional routes
    }
  }
  next()
}
