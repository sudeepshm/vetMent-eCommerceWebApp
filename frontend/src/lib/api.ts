import axios from "axios"
import type {
  Product,
  ProductFilters,
  ProductsResponse,
  Order,
  ShippingAddress,
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

export async function createOrder(
  payload: CreateOrderPayload
): Promise<{ order: Order; clientSecret: string }> {
  const { data } = await api.post<{ order: Order; clientSecret: string }>("/orders", payload)
  return { order: data.order, clientSecret: data.clientSecret }
}

export async function confirmOrderPayment(orderId: string): Promise<Order> {
  const { data } = await api.post<{ order: Order }>(`/orders/${orderId}/confirm-payment`)
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

