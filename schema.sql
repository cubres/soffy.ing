-- The whole database. One table, no users. Created automatically by lib/db.ts on first use.

CREATE TABLE IF NOT EXISTS posts (
  id            text PRIMARY KEY,                 -- ten random characters; the only identity a post has
  body          text NOT NULL,                    -- plain text, exactly as typed
  quote_id      text,                             -- the week's quote it answers, or null
  word_count    integer NOT NULL,
  write_seconds integer NOT NULL,                 -- first keystroke to post
  pause_count   integer NOT NULL,                 -- gaps of ten seconds or more
  clock_seconds integer NOT NULL,                 -- the timer the writer chose
  author_hash   text NOT NULL,                    -- sha256(address | date | salt); changes daily, never reversible
  report_hashes text[] NOT NULL DEFAULT '{}',     -- daily hashes of reporters; three of them hide the post
  hidden        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '30 days'
);

CREATE INDEX IF NOT EXISTS posts_by_time   ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_by_author ON posts (author_hash, created_at DESC);
