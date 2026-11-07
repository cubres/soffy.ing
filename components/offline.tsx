"use client"

import { useEffect } from "react"

// Registers the service worker that keeps the writing page in this browser, so it opens offline.
export default function Offline() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {})
  }, [])
  return null
}
