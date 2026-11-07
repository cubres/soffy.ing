/** @type {import('next').NextConfig} */
const nextConfig = {
  // Both database drivers are loaded at runtime from node_modules, never bundled.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  poweredByHeader: false,
  // The service worker must always be checked for a new version, never served from an HTTP cache.
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] }]
  },
}

export default nextConfig
