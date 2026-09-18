import { timingSafeEqual } from "node:crypto"

// Admin is a single secret in the ADMIN_KEY environment variable. No key set, no admin.
export function adminKeyOk(key: unknown): key is string {
  const expected = process.env.ADMIN_KEY
  if (!expected || typeof key !== "string" || key.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(key), Buffer.from(expected))
}
