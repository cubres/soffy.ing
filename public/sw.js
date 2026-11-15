// The writing page, kept in this browser so it opens without a connection.
// Only the page at "/" and the files it needs are kept. Posts are never stored:
// a post lives on the server for ninety days and nowhere else.
// The spelling and grammar checker is kept too, so it works offline as well.

const CACHE = "soffy-offline-v1"
// Files the page loads later, not from its HTML: the spelling and grammar checker and its WebAssembly.
const LAZY = "soffy-lazy-v1"
const PAGE = "/"

// Every same-origin file the page asks for: scripts, the stylesheet, the fonts, the icon.
function assetsIn(html) {
  const urls = new Set()
  for (const m of html.matchAll(/(?:href|src)="(\/(?:_next\/static\/|icon)[^"]*)"/g)) {
    urls.add(m[1].replace(/&amp;/g, "&"))
  }
  return [...urls]
}

// Fetch the page fresh, keep it and everything it references, and drop what it no longer uses.
async function refresh(response) {
  const cache = await caches.open(CACHE)
  const html = await response.clone().text()
  const assets = assetsIn(html)
  await Promise.all(
    assets.map(async (url) => {
      if (await cache.match(url)) return
      const r = await fetch(url)
      if (r.ok) await cache.put(url, r)
    }),
  )
  await cache.put(PAGE, response)
  const keep = new Set([PAGE, ...assets].map((u) => new URL(u, self.location.origin).href))
  for (const req of await cache.keys()) {
    if (!keep.has(req.url)) await cache.delete(req)
  }
}

// Keep a file fetched after the page loaded. The checker's WebAssembly is about 20 MB,
// so a new one replaces the old instead of piling up.
async function fetchLazy(req, url) {
  const r = await fetch(req)
  if (!r.ok) return r
  const copy = r.clone()
  const keep = (async () => {
    const lazy = await caches.open(LAZY)
    if (url.pathname.endsWith(".wasm")) {
      for (const old of await lazy.keys()) if (old.url.endsWith(".wasm")) await lazy.delete(old)
    }
    await lazy.put(req, copy)
  })()
  keep.catch(() => {})
  return r
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch(PAGE, { cache: "no-store" })
      .then((r) => (r.ok ? refresh(r) : undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE && n !== LAZY).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Pages: always the network first, so the site is never stale while online.
  // Without a connection, "/" opens the kept copy and any other address is sent there.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((r) => {
          if (url.pathname === PAGE && r.ok) event.waitUntil(refresh(r.clone()))
          return r
        })
        .catch(async () => {
          const page = await caches.match(PAGE)
          if (!page) return Response.error()
          return url.pathname === PAGE ? page : Response.redirect(PAGE, 302)
        }),
    )
    return
  }

  // Build files have content-hashed names and never change: the kept copy is as good as the network's.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon")) {
    event.respondWith(caches.match(req).then((hit) => hit || fetchLazy(req, url)))
  }
})
