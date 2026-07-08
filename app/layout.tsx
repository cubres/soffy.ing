import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "soffy.ing",
  description: "soffy.ing",
  generator: "v0.app",
  other: {
    "codex-verification": "2026-07-08",
  },
  icons: {
    icon: "/images/camus.png",
    shortcut: "/images/camus.png",
    apple: "/images/camus.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-serif">{children}</body>
    </html>
  )
}
