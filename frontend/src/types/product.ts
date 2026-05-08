export interface Product {
  _id: string
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  imageBgRemoved?: string
  images: string[]
  category: "men" | "women" | "new" | "accessories"
  sizes: string[]
  colors: Color[]
  rating: number
  reviewCount: number
  inStock: boolean
  stock: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Color {
  name: string
  hex: string
}

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  size?: string
  color?: string
  sort?: "price_asc" | "price_desc" | "newest" | "rating"
  page?: number
  limit?: number
}

export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

export interface Review {
  _id: string
  user: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}
