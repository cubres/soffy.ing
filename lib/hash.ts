import { createHash } from "node:crypto"
import { headers } from "next/headers"

// The only thing the site ever derives from who you are: a hash of your address,
// salted with today's date and a secret. It cannot be reversed, and it changes every day,
// so it can stop one person flooding the site today without being able to recognise them tomorrow.
export async function requesterHash(): Promise<string> {
  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0"
  const day = new Date().toISOString().slice(0, 10)
  const salt = process.env.HASH_SALT || "unsalted"
  return createHash("sha256").update(`${ip}|${day}|${salt}`).digest("hex").slice(0, 32)
}
