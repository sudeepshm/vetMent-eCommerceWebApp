import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {/* Large 404 */}
      <p className="font-serif text-[120px] font-medium leading-none text-neutral-100 select-none md:text-[180px]">
        404
      </p>

      <div className="-mt-6 space-y-4">
        <h1 className="font-serif text-3xl font-medium text-black">
          Page Not Found
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-7 text-neutral-500">
          The page you're looking for doesn't exist, has been moved, or is
          temporarily unavailable.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="btn-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Link href="/products" className="btn-secondary">
          <Search className="h-4 w-4" />
          Browse Collection
        </Link>
      </div>

      {/* Decorative line */}
      <div className="mt-16 h-px w-24 bg-neutral-200" />
    </div>
  )
}
