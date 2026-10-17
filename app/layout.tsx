import type { Metadata } from "next"
import type React from "react"
import { Source_Serif_4 } from "next/font/google"
import "./globals.css"

// Self-hosted at build time. The browser never talks to a font server.
// Source Serif 4 is the typeface Medium sets its articles in; the optical-size axis keeps it crisp at text sizes.
const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://soffy.ing"),
  title: { default: "soffy.ing", template: "%s · soffy.ing" },
  description: "a place to write where text is the only thing that exists.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US" className={serif.variable}>
      <body>
        <header>
          <h1>
            <a href="/">soffy.ing</a>
          </h1>
          <p className="muted">
            <a href="https://philo.soffy.ing">See my writing →</a>
          </p>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
