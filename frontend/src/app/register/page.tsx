"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { register } from "@/lib/auth"
import { useAuthStore } from "@/store/authStore"
import toast from "react-hot-toast"
import { clsx } from "clsx"

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special character", met: /[!@#$%^&*]/.test(password) },
  ]
  const score = checks.filter((c) => c.met).length
  const strengthColor =
    score <= 1 ? "bg-red-400" : score === 2 ? "bg-amber-400" : score === 3 ? "bg-blue-400" : "bg-emerald-500"
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][score]

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= score ? strengthColor : "bg-neutral-200"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        Strength: <span className="font-medium text-black">{strengthLabel}</span>
      </p>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            <CheckCircle
              className={clsx(
                "h-3 w-3 transition-colors",
                c.met ? "text-emerald-500" : "text-neutral-300"
              )}
            />
            <span className={c.met ? "text-neutral-700" : "text-neutral-400"}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.email.trim()) e.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email"
    if (!form.password) e.password = "Password is required"
    else if (form.password.length < 8) e.password = "Must be at least 8 characters"
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      setLoading(true)
      const res = await register({
        name: form.name,
        email: form.email,
        password: form.password,
      })
      if (res.user) {
        setUser(res.user, res.token)
        toast.success(`Account created! Welcome, ${res.user.name.split(" ")[0]}!`)
        router.push("/")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl font-medium text-black">Create Account</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Join VÊTEMENT and experience luxury fashion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-xs font-medium uppercase tracking-[0.15em] text-black">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jane Smith"
              className={`input-field ${errors.name ? "border-red-400" : ""}`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-[0.15em] text-black">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className={`input-field ${errors.email ? "border-red-400" : ""}`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-[0.15em] text-black">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className={`input-field pr-12 ${errors.password ? "border-red-400" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-medium uppercase tracking-[0.15em] text-black">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              className={`input-field ${errors.confirmPassword ? "border-red-400" : ""}`}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-black underline underline-offset-2 transition hover:opacity-70">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
