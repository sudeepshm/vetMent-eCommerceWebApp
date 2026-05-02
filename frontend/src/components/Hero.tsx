import Image from "next/image"
import Link from "next/link"

export default function Hero() {
    return (
        <section className="relative h-[80vh] min-h-[700px] w-full overflow-hidden">
            <div className="absolute inset-0">
                <Image
                    src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1800&q=80"
                    alt="Luxury fashion collection"
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

            <div className="relative z-10 flex h-full items-center px-6 md:px-12">
                <div className="max-w-2xl text-white">
                    <p className="mb-4 text-sm uppercase tracking-[0.35em] text-neutral-300">
                        Luxury Fashion
                    </p>

                    <h1 className="text-5xl font-light uppercase leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                        New Collection
                    </h1>

                    <p className="mt-6 max-w-lg text-base leading-8 text-neutral-200 sm:text-lg">
                        Discover refined silhouettes, timeless essentials, and elevated
                        fashion designed for modern luxury.
                    </p>

                    <div className="mt-10">
                        <Link
                            href="/product"
                            className="inline-flex items-center justify-center border border-white bg-white px-8 py-4 text-sm uppercase tracking-[0.2em] text-black transition-all duration-300 hover:bg-transparent hover:text-white"
                        >
                            Shop Now
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
