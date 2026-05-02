require("dotenv").config({ path: require("path").join(__dirname, "../../.env") })
const mongoose = require("mongoose")
const Product = require("../models/Product")
const User = require("../models/User")

const products = [
  {
    name: "Tailored Wool Blazer",
    description: "A sharp, slim-fit blazer crafted from premium Italian wool. Designed for the modern gentleman who demands both comfort and elegance.",
    price: 480,
    originalPrice: 620,
    image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80"],
    category: "men",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Charcoal", hex: "#4a4a4a" }, { name: "Navy", hex: "#1a2744" }],
    rating: 4.8,
    reviewCount: 124,
    stock: 30,
    inStock: true,
    tags: ["blazer", "formal", "wool"],
  },
  {
    name: "Classic Oxford Shirt",
    description: "Timeless Oxford weave shirt in premium cotton. Effortlessly transitions from boardroom to weekend.",
    price: 185,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"],
    category: "men",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ name: "White", hex: "#ffffff" }, { name: "Light Blue", hex: "#adc8e6" }, { name: "Pale Pink", hex: "#f7d0d0" }],
    rating: 4.6,
    reviewCount: 89,
    stock: 60,
    inStock: true,
    tags: ["shirt", "oxford", "cotton"],
  },
  {
    name: "Slim Tapered Chinos",
    description: "Refined stretch-twill chinos with a tapered silhouette. Versatile, comfortable, and impeccably finished.",
    price: 220,
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80"],
    category: "men",
    sizes: ["28", "30", "32", "34", "36"],
    colors: [{ name: "Camel", hex: "#c2955d" }, { name: "Olive", hex: "#6b7c4d" }, { name: "Stone", hex: "#c4bba3" }],
    rating: 4.5,
    reviewCount: 67,
    stock: 45,
    inStock: true,
    tags: ["chinos", "trousers", "slim"],
  },
  {
    name: "Merino Turtleneck",
    description: "Luxuriously soft superfine merino turtleneck. The definition of quiet luxury — refined, warm, and versatile.",
    price: 295,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80"],
    category: "men",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Oatmeal", hex: "#d4c4a8" }, { name: "Black", hex: "#171717" }, { name: "Forest", hex: "#3d5a40" }],
    rating: 4.9,
    reviewCount: 203,
    stock: 35,
    inStock: true,
    tags: ["merino", "knitwear", "turtleneck"],
  },
  {
    name: "Silk Wrap Dress",
    description: "Fluid, draped silk wrap dress with a deep V-neckline. Effortlessly elegant for any occasion.",
    price: 540,
    originalPrice: 680,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"],
    category: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Ivory", hex: "#fffff0" }, { name: "Dusty Rose", hex: "#dcada9" }],
    rating: 4.7,
    reviewCount: 156,
    stock: 20,
    inStock: true,
    tags: ["silk", "dress", "wrap"],
  },
  {
    name: "Cashmere Blazer",
    description: "Unstructured cashmere blazer with a relaxed, luxurious drape. The ultimate in understated elegance.",
    price: 890,
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80"],
    category: "women",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Camel", hex: "#c2955d" }, { name: "Ecru", hex: "#f5f0e8" }, { name: "Black", hex: "#171717" }],
    rating: 4.9,
    reviewCount: 78,
    stock: 15,
    inStock: true,
    tags: ["cashmere", "blazer", "luxury"],
  },
  {
    name: "High-Waist Palazzo Trousers",
    description: "Wide-leg palazzo trousers in premium crepe. Movement, drama, and elegance in every step.",
    price: 340,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"],
    category: "women",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Black", hex: "#171717" }, { name: "Cream", hex: "#faf7f0" }, { name: "Burgundy", hex: "#6e1c28" }],
    rating: 4.6,
    reviewCount: 92,
    stock: 28,
    inStock: true,
    tags: ["palazzo", "trousers", "wide-leg"],
  },
  {
    name: "Broderie Anglaise Blouse",
    description: "Delicate broderie anglaise blouse with puffed sleeves. A romantic piece rooted in artisan craftsmanship.",
    price: 265,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80"],
    category: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "White", hex: "#ffffff" }, { name: "Blush", hex: "#f2c4c4" }],
    rating: 4.4,
    reviewCount: 45,
    stock: 40,
    inStock: true,
    tags: ["blouse", "broderie", "romantic"],
  },
  {
    name: "Structured Mini Bag",
    description: "Architectural mini bag in smooth full-grain leather. Minimal, functional, and exceptionally crafted.",
    price: 395,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80"],
    category: "accessories",
    sizes: ["One Size"],
    colors: [{ name: "Black", hex: "#171717" }, { name: "Tan", hex: "#c4965c" }, { name: "White", hex: "#ffffff" }],
    rating: 4.8,
    reviewCount: 211,
    stock: 25,
    inStock: true,
    tags: ["bag", "leather", "accessories"],
  },
  {
    name: "Oversized Cotton Trench",
    description: "A modern take on the classic trench coat — oversized, cotton-twill, with clean minimal hardware.",
    price: 720,
    originalPrice: 850,
    image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=800&q=80"],
    category: "new",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Khaki", hex: "#bfb089" }, { name: "Black", hex: "#171717" }],
    rating: 4.7,
    reviewCount: 38,
    stock: 18,
    inStock: true,
    tags: ["trench", "coat", "outerwear", "new"],
  },
  {
    name: "Ribbed Midi Skirt",
    description: "Stretch-rib midi skirt with a body-conscious silhouette. Goes from day to evening with ease.",
    price: 195,
    image: "https://images.unsplash.com/photo-1583496661160-fb5218a170ae?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1583496661160-fb5218a170ae?auto=format&fit=crop&w=800&q=80"],
    category: "new",
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Cream", hex: "#faf7f0" }, { name: "Chocolate", hex: "#4a2c1a" }, { name: "Sage", hex: "#9aac99" }],
    rating: 4.5,
    reviewCount: 62,
    stock: 35,
    inStock: true,
    tags: ["skirt", "ribbed", "midi", "new"],
  },
  {
    name: "Linen Cargo Shorts",
    description: "Relaxed-fit linen cargo shorts with functional pockets and a washed finish for effortless summer dressing.",
    price: 155,
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f43?auto=format&fit=crop&w=800&q=80"],
    category: "men",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Sand", hex: "#d4c39a" }, { name: "Khaki", hex: "#bfb089" }, { name: "Navy", hex: "#1a2744" }],
    rating: 4.3,
    reviewCount: 51,
    stock: 55,
    inStock: true,
    tags: ["shorts", "linen", "summer"],
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("✅ Connected to MongoDB")

    // Clear existing data
    await Product.deleteMany({})
    console.log("🗑️  Cleared existing products")

    // Insert products
    const inserted = await Product.insertMany(products)
    console.log(`✅ Inserted ${inserted.length} products`)

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: "admin@vetement.com" })
    if (!adminExists) {
      await User.create({
        name: "Admin",
        email: "admin@vetement.com",
        password: "Admin@12345",
        role: "admin",
      })
      console.log("✅ Admin user created: admin@vetement.com / Admin@12345")
    }

    console.log("🎉 Seed complete!")
    process.exit(0)
  } catch (err) {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  }
}

seed()
