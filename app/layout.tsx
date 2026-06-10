import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "soffy.ing",
  description: "soffy.ing",
  generator: "v0.app",
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
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/computer-modern@0.1.2/cmu-serif.min.css" />
      </head>
      <body style={{ fontFamily: "'Computer Modern Serif', serif" }}>
        {children}
      </body>
    </html>
  )
}
