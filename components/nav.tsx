"use client"

import { usePathname } from "next/navigation"

const ITEMS: [string, string][] = [
  ["/", "write"],
  ["/read", "read"],
  ["/quote", "quote"],
  ["/about", "about"],
]

export default function Nav() {
  const path = usePathname() ?? "/"
  return (
    <nav aria-label="pages">
      {ITEMS.map(([href, label]) => {
        const current = href === "/" ? path === "/" : path.startsWith(href)
        return (
          <span key={href}>
            [{current ? <b>{label}</b> : <a href={href}>{label}</a>}]
          </span>
        )
      })}
    </nav>
  )
}
