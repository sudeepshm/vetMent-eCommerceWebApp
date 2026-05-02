const mongoose = require("mongoose")

const tryOnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userImageUrl: {
      type: String,
      required: true,
    },
    resultImageUrl: {
      type: String,
      required: true,
    },
    processingTime: {
      type: Number, // milliseconds
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

tryOnSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model("TryOn", tryOnSchema)
