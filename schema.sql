-- The whole database. One table, no users. Created automatically by lib/db.ts on first use.

CREATE TABLE IF NOT EXISTS posts (
  id            text PRIMARY KEY,                 -- ten random characters; the only identity a post has
  body          text NOT NULL,                    -- plain text, exactly as typed
  word_count    integer NOT NULL,
  author_hash   text NOT NULL,                    -- sha256(address | date | salt); changes daily, never reversible
  report_hashes text[] NOT NULL DEFAULT '{}',     -- daily hashes of reporters; three of them hide the post
  hidden        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '30 days'
);

CREATE INDEX IF NOT EXISTS posts_by_time   ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_by_author ON posts (author_hash, created_at DESC);
