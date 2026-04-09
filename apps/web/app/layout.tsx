import "@workspace/ui/globals.css"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { Toaster } from "sonner"

import Background from "@/components/Background"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Wordloom — The Engineering Issue",
  description:
    "Generate phonotactic non-words and explore their potential meanings using WordNet. Vol. 1 of the Wordloom digital collection.",
  keywords: [
    "wordloom",
    "phonotactics",
    "name generator",
    "wordnet",
    "linguistics",
    "creative writing",
  ],
  authors: [{ name: "Neeraj Dalal", url: "https://nrjdalal.com" }],
  openGraph: {
    title: "Wordloom — Studio",
    description: "The digital workbench for crafting entirely new non-words.",
    url: "https://wordloom.nrjdalal.com",
    siteName: "Wordloom",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wordloom — The Art of Phonotactics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wordloom — The Engineering Issue",
    description: "Algorithmic phonotactic generation studio.",
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
