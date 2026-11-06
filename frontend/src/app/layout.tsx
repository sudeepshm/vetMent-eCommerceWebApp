import type { Metadata } from "next"
import { Toaster } from "react-hot-toast"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

export const metadata: Metadata = {
  title: {
    default: "VÊTEMENT — Luxury Fashion",
    template: "%s | VÊTEMENT",
  },
  description:
    "Discover curated luxury fashion. Explore timeless men's, women's, and accessories collections.",
  keywords: ["fashion", "luxury", "clothing", "designer", "apparel"],
  openGraph: {
    title: "VÊTEMENT — Luxury Fashion",
    description: "Shop curated luxury fashion collections",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black antialiased">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#171717",
              color: "#ffffff",
              borderRadius: "0",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.02em",
            },
            success: { iconTheme: { primary: "#ffffff", secondary: "#171717" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#ffffff" } },
          }}
        />
      </body>
    </html>
  )
}
