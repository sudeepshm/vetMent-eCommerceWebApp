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

export interface SizingAdvisory {
  recommended_size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | string
  confidence_score: number
  fit_description: string
  measurements?: {
    shoulder_breadth_cm?: number
    torso_length_cm?: number
    hip_breadth_cm?: number
    calibrated_height_cm?: number
    scale_factor_cm_per_px?: number
  }
}

export interface TryOnSubmitResponse {
  status: "QUEUED" | "PROCESSING"
  job_id: string
  estimated_wait_seconds: number
  status_endpoint: string
}

export interface TryOnJobStatus {
  job_id: string
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"
  current_stage: "QUEUED" | "PREPROCESSING" | "INFERENCE" | "POSTPROCESSING" | "COMPLETED" | "FAILED"
  progress_percentage: number
  elapsed_seconds: number
  result_image_url?: string | null
  sizing_advisory?: SizingAdvisory | null
  telemetry?: {
    preprocessing_ms?: number
    inference_ms?: number
    postprocessing_ms?: number
    total_latency_ms?: number
  } | null
  error?: string | null
}

export interface TryOnRecord {
  _id: string
  user: string
  product: Product
  userImageUrl: string
  resultImageUrl: string
  sizingAdvisory?: SizingAdvisory | null
  telemetry?: any
  createdAt: string
}

export interface ApiError {
  message: string
  status?: number
}

