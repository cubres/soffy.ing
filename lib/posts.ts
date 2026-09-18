import { query } from "./db"
import { newId } from "./ids"
import { currentQuote, previousQuote } from "./quotes"

export const LIMITS = {
  minWords: 40,
  minSeconds: 120,
  maxChars: 40_000,
  maxClockSeconds: 3600,
  lifeDays: 30,
  postsPerDay: 5,
  minutesBetween: 10,
  reportsToHide: 3,
}

export interface Post {
  id: string
  body: string
  quote_id: string | null
  word_count: number
  write_seconds: number
  pause_count: number
  clock_seconds: number
  hidden: boolean
  created_at: Date
  expires_at: Date
}

export interface Draft {
  body: string
  quoteId: string | null
  writeSeconds: number
  pauseCount: number
  clockSeconds: number
}

export type CreateResult = { ok: true; id: string; expiresAt: Date } | { ok: false; error: string }

const COLUMNS =
  "id, body, quote_id, word_count, write_seconds, pause_count, clock_seconds, hidden, created_at, expires_at"

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// Keep newlines and tabs; drop every other control character.
function isAllowed(ch: string): boolean {
  const code = ch.charCodeAt(0)
  if (code === 10 || code === 9) return true
  return code >= 32 && code !== 127
}

// Normalise line endings, drop control characters, trim trailing spaces and runaway blank lines.
export function cleanBody(raw: string): string {
  return Array.from(raw.replace(/\r\n?/g, "\n"))
    .filter(isAllowed)
    .join("")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
}

function fail(error: string): CreateResult {
  return { ok: false, error }
}

function int(value: unknown): number {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) ? n : -1
}

export async function createPost(draft: Draft, authorHash: string): Promise<CreateResult> {
  const body = cleanBody(String(draft.body ?? ""))
  const words = countWords(body)
  if (!body) return fail("there is nothing to post.")
  if (body.length > LIMITS.maxChars)
    return fail(`too long: the limit is ${LIMITS.maxChars.toLocaleString("en-GB")} characters.`)
  if (words < LIMITS.minWords) return fail(`too short: at least ${LIMITS.minWords} words.`)

  const writeSeconds = int(draft.writeSeconds)
  const pauseCount = int(draft.pauseCount)
  const clockSeconds = int(draft.clockSeconds)
  if (clockSeconds < 1 || clockSeconds > LIMITS.maxClockSeconds) return fail("the clock must be on to post.")
  if (writeSeconds < LIMITS.minSeconds)
    return fail(`too fast: at least ${LIMITS.minSeconds / 60} minutes under the clock.`)
  if (pauseCount < 0) return fail("the clock did not add up.")

  let quoteId: string | null = null
  if (draft.quoteId) {
    const allowed = [currentQuote().id, previousQuote().id]
    if (!allowed.includes(draft.quoteId)) return fail("that quote is no longer this week's or last week's.")
    quoteId = draft.quoteId
  }

  const [counts] = await query<{ recent: string | number; today: string | number }>(
    `SELECT
       count(*) FILTER (WHERE created_at > now() - interval '${LIMITS.minutesBetween} minutes') AS recent,
       count(*) AS today
     FROM posts
     WHERE author_hash = $1 AND created_at > now() - interval '24 hours'`,
    [authorHash],
  )
  if (Number(counts.recent) > 0) return fail(`one post every ${LIMITS.minutesBetween} minutes. wait a little.`)
  if (Number(counts.today) >= LIMITS.postsPerDay)
    return fail(`${LIMITS.postsPerDay} posts a day is the limit. come back tomorrow.`)

  const id = newId()
  const [row] = await query<{ expires_at: Date }>(
    `INSERT INTO posts (id, body, quote_id, word_count, write_seconds, pause_count, clock_seconds, author_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now() + interval '${LIMITS.lifeDays} days')
     RETURNING expires_at`,
    [id, body, quoteId, words, Math.min(writeSeconds, 86_400), pauseCount, clockSeconds, authorHash],
  )

  // Expired posts are invisible the moment they expire; this only reclaims the disk a day later.
  await query(`DELETE FROM posts WHERE expires_at < now() - interval '1 day'`)

  return { ok: true, id, expiresAt: new Date(row.expires_at) }
}

export async function listPosts(opts: { before?: Date; limit?: number; quoteId?: string } = {}): Promise<Post[]> {
  const limit = opts.limit ?? 20
  const params: unknown[] = [limit]
  const where = ["NOT hidden", "expires_at > now()"]
  if (opts.before && !Number.isNaN(opts.before.getTime())) {
    params.push(opts.before.toISOString())
    where.push(`created_at < $${params.length}`)
  }
  if (opts.quoteId) {
    params.push(opts.quoteId)
    where.push(`quote_id = $${params.length}`)
  }
  return query<Post>(
    `SELECT ${COLUMNS} FROM posts WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT $1`,
    params,
  )
}

export async function getPost(id: string): Promise<Post | null> {
  const rows = await query<Post>(
    `SELECT ${COLUMNS} FROM posts WHERE id = $1 AND NOT hidden AND expires_at > now()`,
    [id],
  )
  return rows[0] ?? null
}

// A post disappears once enough different people have reported it. Each daily hash counts once.
export async function reportPost(id: string, reporterHash: string): Promise<void> {
  await query(
    `UPDATE posts
     SET report_hashes = array_append(report_hashes, $2),
         hidden = hidden OR cardinality(report_hashes) + 1 >= ${LIMITS.reportsToHide}
     WHERE id = $1 AND NOT ($2 = ANY(report_hashes))`,
    [id, reporterHash],
  )
}

export async function adminList(): Promise<(Post & { reports: number })[]> {
  const rows = await query<Post & { reports: string | number }>(
    `SELECT ${COLUMNS}, cardinality(report_hashes) AS reports FROM posts ORDER BY created_at DESC LIMIT 200`,
  )
  return rows.map((r) => ({ ...r, reports: Number(r.reports) }))
}

export async function setHidden(id: string, hidden: boolean): Promise<void> {
  await query(`UPDATE posts SET hidden = $2 WHERE id = $1`, [id, hidden])
}

export async function deletePost(id: string): Promise<void> {
  await query(`DELETE FROM posts WHERE id = $1`, [id])
}
