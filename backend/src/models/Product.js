const mongoose = require("mongoose")

const colorSchema = new mongoose.Schema(
  { name: String, hex: String },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      required: [true, "Main image is required"],
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["men", "women", "new", "accessories"],
      lowercase: true,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [colorSchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 50,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
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

// Text index for search
productSchema.index({ name: "text", description: "text", tags: "text" })
// Category filter index
productSchema.index({ category: 1, price: 1 })

module.exports = mongoose.model("Product", productSchema)
