import axios from "axios"
import type {
  Product,
  ProductFilters,
  ProductsResponse,
  Order,
  ShippingAddress,
  TryOnRecord,
} from "@/types"

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// ── Request interceptor: attach JWT token from localStorage ──
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      try {
        const authRaw = localStorage.getItem("fashion-auth")
        if (authRaw) {
          const { state } = JSON.parse(authRaw)
          if (state?.token) {
            config.headers.Authorization = `Bearer ${state.token}`
          }
        }
      } catch {
        // silently fail
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle global errors ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An error occurred"
    return Promise.reject(new Error(message))
  }
)

// ─────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────

export async function getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value))
      }
    })
  }
  const { data } = await api.get<ProductsResponse>(`/products?${params.toString()}`)
  return data
}

export async function getProductById(id: string): Promise<Product> {
  const { data } = await api.get<{ product: Product }>(`/products/${id}`)
  return data.product
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const { data } = await api.get<{ products: Product[] }>(
    `/products?limit=${limit}&sort=rating`
  )
  return data.products
}

// ─────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────

export interface CreateOrderPayload {
  items: Array<{
    product: string
    size: string
    color: string
    quantity: number
    price: number
  }>
  shippingAddress: ShippingAddress
  subtotal: number
  shippingCost: number
  total: number
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<{ order: Order }>("/orders", payload)
  return data.order
}

export async function getMyOrders(): Promise<Order[]> {
  const { data } = await api.get<{ orders: Order[] }>("/orders/my-orders")
  return data.orders
}

export async function getOrderById(id: string): Promise<Order> {
  const { data } = await api.get<{ order: Order }>(`/orders/${id}`)
  return data.order
}

// ─────────────────────────────────────────────
// AI Try-On
// ─────────────────────────────────────────────

export interface TryOnPayload {
  userImage: File
  productId: string
  garmentImageUrl: string
}

export async function submitTryOn(payload: TryOnPayload): Promise<TryOnRecord> {
  const formData = new FormData()
  formData.append("userImage", payload.userImage)
  formData.append("productId", payload.productId)
  formData.append("garmentImageUrl", payload.garmentImageUrl)

  const { data } = await api.post<{ tryOn: TryOnRecord }>("/ai/tryon", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data.tryOn
}

export async function getMyTryOns(): Promise<TryOnRecord[]> {
  const { data } = await api.get<{ tryOns: TryOnRecord[] }>("/ai/my-tryons")
  return data.tryOns
}

// ─────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────

export async function adminGetAllOrders(): Promise<Order[]> {
  const { data } = await api.get<{ orders: Order[] }>("/orders/admin/all")
  return data.orders
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: string
): Promise<Order> {
  const { data } = await api.patch<{ order: Order }>(`/orders/${orderId}/status`, {
    status,
  })
  return data.order
}

export async function adminCreateProduct(
  formData: FormData
): Promise<Product> {
  const { data } = await api.post<{ product: Product }>("/products", formData, {
    headers: { "Content-Type": undefined },
  })
  return data.product
}

export async function adminUpdateProduct(
  id: string,
  formData: FormData
): Promise<Product> {
  const { data } = await api.put<{ product: Product }>(`/products/${id}`, formData, {
    headers: { "Content-Type": undefined },
  })
  return data.product
}

export async function adminDeleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}

export default api
