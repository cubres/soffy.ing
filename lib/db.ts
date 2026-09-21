// The whole storage layer. One table, no users.
// With DATABASE_URL set (Neon, or any Postgres) it uses postgres.js.
// Without it (local development) it uses PGlite, an in-process Postgres kept in .data/.

import { mkdirSync } from "node:fs"

type Row = Record<string, unknown>

export class NoDatabaseError extends Error {
  constructor() {
    super("no database is connected yet")
    this.name = "NoDatabaseError"
  }
}

export function isNoDatabase(error: unknown): boolean {
  return error instanceof Error && error.name === "NoDatabaseError"
}

interface Driver {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS posts (
    id            text PRIMARY KEY,
    body          text NOT NULL,
    word_count    integer NOT NULL,
    author_hash   text NOT NULL,
    report_hashes text[] NOT NULL DEFAULT '{}',
    hidden        boolean NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now(),
    expires_at    timestamptz NOT NULL DEFAULT now() + interval '90 days'
  )`,
  // Columns from the days when the site had a clock and a weekly quote. Harmless on a fresh table.
  `ALTER TABLE posts
     DROP COLUMN IF EXISTS quote_id,
     DROP COLUMN IF EXISTS write_seconds,
     DROP COLUMN IF EXISTS pause_count,
     DROP COLUMN IF EXISTS clock_seconds`,
  // The table was first created when posts lived thirty days. Inserts set the date explicitly,
  // but keep the column's own default honest too.
  `ALTER TABLE posts ALTER COLUMN expires_at SET DEFAULT now() + interval '90 days'`,
  `CREATE INDEX IF NOT EXISTS posts_by_time ON posts (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS posts_by_author ON posts (author_hash, created_at DESC)`,
]

async function connect(): Promise<Driver> {
  const url = process.env.DATABASE_URL
  if (url) {
    const postgres = (await import("postgres")).default
    const local = /localhost|127\.0\.0\.1/.test(url)
    const sql = postgres(url, { ssl: local ? undefined : "require", max: 5 })
    return {
      async query<T>(text: string, params: unknown[] = []) {
        const rows = await sql.unsafe(text, params as never[])
        return Array.from(rows) as unknown as T[]
      },
    }
  }
  if (process.env.VERCEL) {
    // Deployed without a database: say so plainly instead of crashing on a read-only disk.
    throw new NoDatabaseError()
  }
  mkdirSync(".data", { recursive: true })
  const { PGlite } = await import("@electric-sql/pglite")
  const pg = new PGlite(".data/pglite")
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const result = await pg.query<T>(text, params)
      return result.rows
    },
  }
}

// One connection per process, surviving hot reloads in development.
const g = globalThis as unknown as { __soffyDb?: Promise<Driver> }

function driver(): Promise<Driver> {
  if (!g.__soffyDb) {
    g.__soffyDb = connect().then(async (d) => {
      for (const statement of SCHEMA) await d.query(statement)
      return d
    })
    g.__soffyDb.catch(() => {
      g.__soffyDb = undefined
    })
  }
  return g.__soffyDb
}

export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await driver()).query<T>(text, params)
}
