const Product = require("../models/Product")
const cloudinary = require("../config/cloudinary")

// Upload a buffer to Cloudinary and return the secure URL
const uploadBufferToCloudinary = (buffer, folder = "fashion/products") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", quality: "auto:good" },
      (err, result) => {
        if (err) return reject(err)
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })

const safeParseColors = (colors) => {
  if (!colors) return []
  if (Array.isArray(colors)) return colors
  try { return JSON.parse(colors) } catch { return [] }
}

// GET /api/products
exports.getProducts = async (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    size,
    sort = "newest",
    page = 1,
    limit = 12,
    search,
  } = req.query

  // ── Build filter ──
  const filter = {}
  if (category) filter.category = category
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {}
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice)
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice)
  }
  if (size) filter.sizes = { $in: [size] }
  if (search) {
    filter.$text = { $search: search }
  }

  // ── Build sort ──
  let sortQuery = {}
  switch (sort) {
    case "price_asc":
      sortQuery = { price: 1 }
      break
    case "price_desc":
      sortQuery = { price: -1 }
      break
    case "rating":
      sortQuery = { rating: -1 }
      break
    case "newest":
    default:
      sortQuery = { createdAt: -1 }
  }

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.min(50, Math.max(1, Number(limit)))
  const skip = (pageNum - 1) * limitNum

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortQuery).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    products,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  })
}

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" })
  }
  res.status(200).json({ success: true, product })
}

// POST /api/products (admin)
exports.createProduct = async (req, res) => {
  const {
    name, description, price, originalPrice,
    category, sizes, colors, tags, stock,
  } = req.body

  // Upload image to Cloudinary if provided
  let image = ""
  if (req.file) {
    image = await uploadBufferToCloudinary(req.file.buffer)
  }

  if (!image) {
    return res.status(400).json({ success: false, message: "Product image is required" })
  }

  const product = await Product.create({
    name,
    description,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : null,
    image,
    images: [image],
    category,
    sizes: Array.isArray(sizes) ? sizes : sizes?.split(",").map((s) => s.trim()) ?? [],
    colors: safeParseColors(colors),
    tags: Array.isArray(tags) ? tags : tags?.split(",").map((t) => t.trim()) ?? [],
    stock: Number(stock ?? 50),
    inStock: Number(stock ?? 50) > 0,
  })

  res.status(201).json({ success: true, product })
}

// PUT /api/products/:id (admin)
exports.updateProduct = async (req, res) => {
  const updates = { ...req.body }

  // Upload new image to Cloudinary if a file was provided
  if (req.file) {
    const imageUrl = await uploadBufferToCloudinary(req.file.buffer)
    updates.image = imageUrl
    updates.images = [imageUrl]
  }

  if (updates.price) updates.price = Number(updates.price)
  if (updates.originalPrice) updates.originalPrice = Number(updates.originalPrice)
  if (updates.stock !== undefined) {
    updates.stock = Number(updates.stock)
    updates.inStock = updates.stock > 0
  }
  if (updates.sizes && typeof updates.sizes === "string") {
    updates.sizes = updates.sizes.split(",").map((s) => s.trim())
  }
  if (updates.tags && typeof updates.tags === "string") {
    updates.tags = updates.tags.split(",").map((t) => t.trim())
  }
  if (updates.colors) {
    updates.colors = safeParseColors(updates.colors)
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" })
  }

  res.status(200).json({ success: true, product })
}

// DELETE /api/products/:id (admin)
exports.deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" })
  }
  res.status(200).json({ success: true, message: "Product deleted" })
}
