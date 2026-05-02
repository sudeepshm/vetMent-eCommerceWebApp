import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Sparkles, Shield, Truck } from "lucide-react"
import ProductCard from "@/components/ProductCard"
import NewsletterForm from "@/components/NewsletterForm"
import { getFeaturedProducts } from "@/lib/api"
import type { Product } from "@/types"

export const metadata: Metadata = {
  title: "VÊTEMENT — Luxury Fashion with AI Try-On",
  description:
    "Shop the finest curated luxury fashion. Featuring an AI-powered virtual try-on so you can see outfits on yourself before buying.",
}

const CATEGORIES = [
  {
    label: "Men",
    href: "/products?category=men",
    image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Women",
    href: "/products?category=women",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "New Arrivals",
    href: "/products?category=new",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  },
]

const PERKS = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On all orders over $150",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Your data is always protected",
  },
  {
    icon: Sparkles,
    title: "AI Try-On",
    description: "See clothes on yourself before buying",
  },
]

export default async function HomePage() {
  let featuredProducts: Product[] = []
  try {
    featuredProducts = await getFeaturedProducts(8)
  } catch {
    // Render without products if backend is offline during build
  }

  return (
    <main>
      {/* ─────────────── HERO ─────────────── */}
      <section className="relative h-[90vh] min-h-[700px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85"
          alt="VÊTEMENT luxury fashion collection"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="relative z-10 flex h-full items-center px-6 md:px-16 lg:px-24">
          <div className="max-w-2xl text-white">
            <p className="mb-5 text-xs uppercase tracking-[0.5em] text-neutral-300 animate-fade-in">
              Spring · Summer 2026
            </p>
            <h1 className="font-serif text-6xl font-medium leading-tight sm:text-7xl lg:text-8xl animate-slide-up">
              Wear Your
              <br />
              <em className="not-italic text-gold-400">Confidence</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-neutral-300 sm:text-lg animate-slide-up">
              Curated luxury fashion meets AI-powered virtual try‑on. See
              exactly how it looks on you — before you buy.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 animate-fade-in">
              <Link href="/products" className="btn-primary">
                Shop Collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/try-on"
                className="flex items-center gap-2 border border-white/60 bg-white/10 px-8 py-3.5 text-sm uppercase tracking-[0.2em] text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Sparkles className="h-4 w-4" />
                AI Try‑On
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60">
          <span className="text-xs uppercase tracking-[0.3em]">Scroll</span>
          <div className="h-10 w-px animate-pulse bg-white/40" />
        </div>
      </section>

      {/* ─────────────── PERKS ─────────────── */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 divide-y divide-neutral-200 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-12">
          {PERKS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-center gap-4 px-4 py-8 sm:px-10"
            >
              <Icon className="h-6 w-6 flex-shrink-0 text-black" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-black">{title}</p>
                <p className="text-xs text-neutral-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── CATEGORIES ─────────────── */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-12 text-center">
            <p className="section-label mb-3">Explore</p>
            <h2 className="section-heading">Shop by Category</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group relative aspect-[3/4] overflow-hidden"
              >
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 transition-opacity duration-300 group-hover:bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-white">
                  <h3 className="font-serif text-3xl font-medium">{cat.label}</h3>
                  <span className="mt-3 flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-white/80 transition-all duration-300 group-hover:gap-3">
                    Shop Now <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── FEATURED PRODUCTS ─────────────── */}
      {featuredProducts.length > 0 && (
        <section className="px-6 pb-20 md:px-12 md:pb-28">
          <div className="mx-auto max-w-[1600px]">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="section-label mb-3">Curated Selection</p>
                <h2 className="section-heading">Featured Pieces</h2>
              </div>
              <Link
                href="/products"
                className="hidden items-center gap-1.5 text-sm text-neutral-500 transition hover:text-black sm:flex"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((product, i) => (
                <ProductCard key={product._id} product={product} priority={i < 4} />
              ))}
            </div>

            <div className="mt-12 text-center sm:hidden">
              <Link href="/products" className="btn-secondary">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────── AI TRY‑ON FEATURE ─────────────── */}
      <section className="bg-neutral-950 px-6 py-24 md:px-12">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="text-white">
              <p className="mb-4 text-xs uppercase tracking-[0.5em] text-neutral-400">
                AI Technology
              </p>
              <h2 className="font-serif text-5xl font-medium leading-tight sm:text-6xl">
                See It On
                <br />
                <em className="not-italic text-gold-400">Yourself</em>
              </h2>
              <p className="mt-6 max-w-md text-base leading-8 text-neutral-400">
                Upload your photo and our AI instantly generates a realistic
                preview of how any outfit looks on your body. No more guessing.
                Shop with confidence.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-neutral-300">
                {[
                  "Upload a full-body photo",
                  "Select any item from our collection",
                  "Get an AI-generated preview in seconds",
                  "Save and share your looks",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 text-xs text-neutral-400">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
              <Link href="/try-on" className="btn-primary mt-10 inline-flex">
                <Sparkles className="h-4 w-4" />
                Try It Free
              </Link>
            </div>

            {/* Mockup visual */}
            <div className="relative hidden aspect-square lg:block">
              <Image
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"
                alt="AI Virtual try-on feature preview"
                fill
                sizes="50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 border border-white/10" />
              {/* Overlay badge */}
              <div className="absolute bottom-8 left-8 right-8 glass p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  AI Processing
                </p>
                <p className="mt-1 font-serif text-lg">Virtual Try‑On Ready</p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-3/4 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── NEWSLETTER ─────────────── */}
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-[1600px] text-center">
          <p className="section-label mb-3">Stay Updated</p>
          <h2 className="section-heading mb-4">Join Our World</h2>
          <p className="mx-auto max-w-md text-sm leading-7 text-neutral-500">
            Get early access to new collections, exclusive offers, and style
            inspiration delivered to your inbox.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </main>
  )
}
