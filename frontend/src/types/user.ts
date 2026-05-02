import type { Product } from "./product"

export interface User {
  _id: string
  id: string
  name: string
  email: string
  role: "user" | "admin"
  avatar?: string
  createdAt: string
}

export interface AuthResponse {
  success: boolean
  user: User
  token?: string
  message?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export interface CartItem {
  product: Product
  size: string
  color: string
  quantity: number
}

export interface ShippingAddress {
  fullName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export interface Order {
  _id: string
  id: string
  user: string | User
  items: OrderItem[]
  total: number
  subtotal: number
  shippingCost: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  shippingAddress: ShippingAddress
  paymentStatus: "pending" | "paid" | "failed"
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  product: Product
  size: string
  color: string
  quantity: number
  price: number
}

export interface TryOnRecord {
  _id: string
  user: string
  product: Product
  userImageUrl: string
  resultImageUrl: string
  createdAt: string
}

export interface ApiError {
  message: string
  status?: number
}
