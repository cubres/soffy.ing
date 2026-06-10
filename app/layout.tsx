import type React from "react"
import type { Metadata } from "next"
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google"
import "./globals.css"

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-ibm-plex-serif",
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-ibm-plex-sans",
})

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
    <html lang="en" className={`${ibmPlexSerif.variable} ${ibmPlexSans.variable}`}>
      <body className="font-serif">{children}</body>
    </html>
  )
}
