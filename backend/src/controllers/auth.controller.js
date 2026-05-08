const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { sendWelcomeEmail } = require("../services/email.service")

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({
    success: true,
    token,
    user,
  })
}

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" })
  }

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already in use" })
  }

  const user = await User.create({ name, email, password })

  // Send welcome email (non-blocking — don't fail registration if email fails)
  sendWelcomeEmail(user).catch((err) =>
    console.error("[Auth] Welcome email failed:", err.message)
  )

  sendTokenResponse(user, 201, res)
}

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" })
  }

  const user = await User.findOne({ email }).select("+password")
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" })
  }

  sendTokenResponse(user, 200, res)
}

// POST /api/auth/logout
exports.logout = (_req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" })
}

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }
  res.status(200).json({ success: true, user })
}

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  const updates = {}
  if (req.body.name) updates.name = req.body.name
  if (req.file) updates.avatar = req.file.path // Cloudinary URL

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({ success: true, user })
}

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both passwords required" })
  }

  const user = await User.findById(req.user.id).select("+password")
  if (!user || !(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, message: "Current password is incorrect" })
  }

  user.password = newPassword
  await user.save()

  res.status(200).json({ success: true, message: "Password updated successfully" })
}
