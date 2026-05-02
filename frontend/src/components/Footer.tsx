import Link from "next/link"

export default function Footer() {
    const navLinks = [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
    ]

    const socialLinks = [
        { label: "Instagram", href: "https://instagram.com" },
        { label: "Facebook", href: "https://facebook.com" },
        { label: "Twitter", href: "https://twitter.com" },
    ]

    return (
        <footer className="w-full border-t border-neutral-200 bg-white">
            <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-12">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
                    <div className="space-y-4">
                        <Link
                            href="/"
                            className="inline-block text-lg font-medium uppercase tracking-[0.35em] text-black transition-opacity duration-300 hover:opacity-70"
                        >
                            FASHION
                        </Link>

                        <p className="max-w-xs text-sm leading-7 text-neutral-600">
                            Luxury fashion essentials designed with timeless elegance and
                            modern minimalism.
                        </p>
                    </div>

                    <div>
                        <h3 className="mb-5 text-sm uppercase tracking-[0.2em] text-black">
                            Navigation
                        </h3>

                        <ul className="space-y-3">
                            {navLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-600 transition duration-300 hover:text-black hover:underline"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-5 text-sm uppercase tracking-[0.2em] text-black">
                            Social
                        </h3>

                        <ul className="space-y-3">
                            {socialLinks.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-neutral-600 transition duration-300 hover:text-black hover:underline"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-5 text-sm uppercase tracking-[0.2em] text-black">
                            Newsletter
                        </h3>

                        <p className="mb-5 text-sm leading-7 text-neutral-600">
                            Stay updated with new arrivals and curated collections.
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black"
                            />

                            <button className="border border-black bg-black px-5 py-3 text-sm uppercase tracking-[0.15em] text-white transition hover:bg-white hover:text-black">
                                Join
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-16 border-t border-neutral-200 pt-8 text-center text-xs uppercase tracking-[0.15em] text-neutral-500 md:flex md:items-center md:justify-between md:text-left">
                    <p>© 2026 Fashion. All rights reserved.</p>

                    <p className="mt-4 md:mt-0">
                        Designed for modern luxury experiences.
                    </p>
                </div>
            </div>
        </footer>
    )
}
