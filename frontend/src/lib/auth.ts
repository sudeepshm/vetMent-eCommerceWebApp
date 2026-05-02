import api from "./api"
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from "@/types"

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", credentials)
  return data
}

export async function register(
  credentials: RegisterCredentials
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", credentials)
  return data
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout")
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>("/auth/me")
  return data.user
}

export async function updateProfile(updates: {
  name?: string
  avatar?: File
}): Promise<User> {
  const formData = new FormData()
  if (updates.name) formData.append("name", updates.name)
  if (updates.avatar) formData.append("avatar", updates.avatar)

  const { data } = await api.put<{ user: User }>("/auth/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data.user
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.put("/auth/change-password", { currentPassword, newPassword })
}
