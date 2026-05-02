"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ShoppingBag, User, X, Sparkles, LogOut, Settings, Package } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { useAuthStore } from "@/store/authStore"
import { logout } from "@/lib/auth"
import toast from "react-hot-toast"
import { clsx } from "clsx"

const navLinks = [
  { label: "Men", href: "/products?category=men" },
  { label: "Women", href: "/products?category=women" },
  { label: "New", href: "/products?category=new" },
  { label: "AI Try‑On", href: "/try-on", highlight: true },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()

  const itemCount = useCartStore((s) => s.itemCount())
  const { user, isAuthenticated, clearAuth } = useAuthStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setIsOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      toast.success("Signed out successfully")
      setUserMenuOpen(false)
    }
  }

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-neutral-200 bg-white/98 shadow-sm backdrop-blur-md"
          : "border-b border-neutral-200 bg-white"
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between px-6 md:px-12">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="font-serif text-xl font-medium uppercase tracking-[0.35em] text-black transition-opacity duration-300 hover:opacity-70"
        >
          VÊTEMENT
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={clsx(
                "group relative text-sm uppercase tracking-[0.2em] transition-colors duration-300",
                link.highlight
                  ? "flex items-center gap-1.5 text-neutral-800 hover:text-black"
                  : "text-neutral-600 hover:text-black",
                pathname.startsWith(link.href.split("?")[0]) && "text-black"
              )}
            >
              {link.highlight && (
                <Sparkles className="h-3.5 w-3.5 text-gold-500" strokeWidth={1.5} />
              )}
              <span>{link.label}</span>
              <span
                className={clsx(
                  "absolute -bottom-2 left-0 h-px bg-black transition-all duration-300",
                  pathname.startsWith(link.href.split("?")[0]) ? "w-full" : "w-0 group-hover:w-full"
                )}
              />
            </Link>
          ))}
        </nav>

        {/* ── Desktop Actions ── */}
        <div className="hidden items-center gap-6 md:flex">
          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center transition duration-300 hover:opacity-70"
            aria-label={`Cart — ${itemCount} items`}
          >
            <ShoppingBag className="h-5 w-5 text-black" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-medium text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {/* User / Auth */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 transition duration-300 hover:opacity-70"
                aria-label="User menu"
              >
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-52 animate-slide-up border border-neutral-200 bg-white py-1 shadow-lg">
                  <p className="border-b border-neutral-100 px-4 py-2.5 text-xs text-neutral-500">
                    {user.email}
                  </p>
                  <Link
                    href="/account"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-black"
                  >
                    <Package className="h-4 w-4" strokeWidth={1.5} />
                    My Orders
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-black"
                    >
                      <Settings className="h-4 w-4" strokeWidth={1.5} />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-black"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center transition duration-300 hover:opacity-70"
              aria-label="Login"
            >
              <User className="h-5 w-5 text-black" strokeWidth={1.5} />
            </Link>
          )}
        </div>

        {/* ── Mobile: Cart + Hamburger ── */}
        <div className="flex items-center gap-4 md:hidden">
          <Link href="/cart" className="relative" aria-label="Cart">
            <ShoppingBag className="h-5 w-5 text-black" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-medium text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Toggle Menu"
            onClick={() => setIsOpen((p) => !p)}
            className="text-black transition-opacity duration-300 hover:opacity-70"
          >
            {isOpen ? (
              <X className="h-6 w-6" strokeWidth={1.5} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={clsx(
          "overflow-hidden border-t border-neutral-200 bg-white transition-all duration-300 md:hidden",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="flex flex-col px-6 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={clsx(
                "flex items-center gap-2 border-b border-neutral-100 py-4 text-sm uppercase tracking-[0.2em] transition-all duration-300 hover:pl-2 hover:text-black",
                link.highlight ? "text-neutral-800" : "text-neutral-600"
              )}
            >
              {link.highlight && (
                <Sparkles className="h-3.5 w-3.5 text-gold-500" strokeWidth={1.5} />
              )}
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-6 pt-5">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-black"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.5} />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-black"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
