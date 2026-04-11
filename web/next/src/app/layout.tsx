import "@/styles/globals.css"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { Toaster } from "sonner"

import Background from "@/components/Background"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Wordloom — Find short, pronounceable names",
  description:
    "Find short, pronounceable names for brands, products, and projects. Every name sounds like it could be a real word.",
  keywords: [
    "wordloom",
    "name generator",
    "brand names",
    "product names",
    "pronounceable names",
    "naming tool",
  ],
  authors: [{ name: "Neeraj Dalal", url: "https://nrjdalal.com" }],
  openGraph: {
    title: "Wordloom — Find short, pronounceable names",
    description:
      "Find short, pronounceable names for brands, products, and projects. Every name sounds like it could be a real word.",
    url: "https://wordloom.nrjdalal.com",
    siteName: "Wordloom",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wordloom — Find short, pronounceable names",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wordloom — Find short, pronounceable names",
    description:
      "Find short, pronounceable names for brands, products, and projects. Every name sounds like it could be a real word.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body>
        <ThemeProvider>
          <Background />
          {children}
          <Toaster
            position="bottom-right"
            closeButton
            toastOptions={{
              style: {
                background: "#ecebe5",
                color: "#1a1a1a",
                border: "1px solid #1a1a1a",
                borderRadius: "0",
                fontSize: "12px",
                textTransform: "uppercase",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
