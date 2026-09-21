import type { Metadata } from "next"
import type React from "react"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

// Self-hosted at build time. The browser never talks to a font server.
const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://soffy.ing"),
  title: { default: "soffy.ing", template: "%s · soffy.ing" },
  description: "a place to write where text is the only thing that exists.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <header>
          <h1>
            <a href="/">soffy.ing</a>
          </h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
