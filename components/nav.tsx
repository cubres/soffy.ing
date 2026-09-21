"use client"

import { usePathname } from "next/navigation"

const ITEMS: [string, string][] = [
  ["/", "write"],
  ["/about", "about"],
]

export default function Nav() {
  const path = usePathname() ?? "/"
  return (
    <nav aria-label="pages">
      {ITEMS.map(([href, label]) => {
        const current = href === "/" ? path === "/" : path.startsWith(href)
        return current ? (
          <b key={href}>{label}</b>
        ) : (
          <a key={href} href={href}>
            {label}
          </a>
        )
      })}
    </nav>
  )
}
