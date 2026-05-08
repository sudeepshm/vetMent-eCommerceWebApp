/**
 * AdvisorSession.js
 *
 * MongoDB model for persisting per-user Style Advisor chat history.
 * One document per user — messages are appended in-place.
 *
 * DBMS design note:
 *   We use a single-document-per-user approach (upsert pattern) rather than
 *   a message-per-document collection. This is optimal for the read pattern
 *   (always load all messages for a user at once) and keeps the query simple.
 */

const mongoose = require("mongoose")

const advisorMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "advisor"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 8000,
    },
    // Stored as a data URL string for display; optional (image uploads)
    imagePreview: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
)

const advisorSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one session document per user
    },
    messages: {
      type: [advisorMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v
        return ret
      },
    },
  }
)

// Index for fast user lookups
advisorSessionSchema.index({ user: 1 }, { unique: true })

module.exports = mongoose.model("AdvisorSession", advisorSessionSchema)
