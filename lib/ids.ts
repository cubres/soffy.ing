import { randomBytes } from "node:crypto"

// Lowercase letters and digits with the ambiguous ones removed. Ten characters is about fifty bits.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"

export function newId(length = 10): string {
  const bytes = randomBytes(length)
  let id = ""
  for (let i = 0; i < length; i++) id += ALPHABET[bytes[i] % ALPHABET.length]
  return id
}

export function isId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]{6,20}$/.test(value)
}
