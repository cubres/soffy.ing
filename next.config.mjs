/** @type {import('next').NextConfig} */
const nextConfig = {
  // Both database drivers are loaded at runtime from node_modules, never bundled.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  poweredByHeader: false,
}

export default nextConfig
