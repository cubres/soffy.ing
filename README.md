# soffy.ing

*sophia, as a verb.*

A place to write where text is the only thing that exists. No names, no numbers, no images, no memory.

You write. If you want, you post it, anonymously, and get an address you can give to anyone. Thirty days later it is gone.

The argument for all of this is on the site itself, at [soffy.ing/about](https://soffy.ing/about). This file is about how it is built.

## the four refusals, in code

| refusal | what the code does |
|---|---|
| no names | there is no `users` table. the only table is `posts`. |
| no numbers | posts have no likes, views or counters. the only number stored is the word count. |
| no images | there are no image files in the repository. the favicon is an SVG containing the two characters `s.`, and the design is one CSS file: black type on a white page. |
| no memory | every post has an `expires_at` and every query filters on it, so a post stops existing for readers the second it expires. there is no feed, no search and no archive; a post is reachable only by its address. `robots.txt` tells every model crawler to keep out. no analytics, no cookies, no third-party requests; the typeface is self-hosted. |

## the shape of it

- **Next.js 15**, App Router, TypeScript. Server components everywhere except the editor and the nav.
- **One CSS file**, `app/globals.css`. One typeface, JetBrains Mono, self-hosted at build. Every control is a word; the only colour is red, and it only means loss.
- **One table**, `posts`. See `schema.sql`. Created automatically on first use.
- **Five runtime dependencies**: `next`, `react`, `react-dom`, `postgres` (production) and `@electric-sql/pglite` (local development, an in-process Postgres so the site runs with zero setup).
- **No API routes.** Posting, reporting and moderation are server actions in `lib/actions.ts`.

```
app/            pages: / (write), /p/[id], /about, /admin, robots.txt
components/     editor (client), nav (client), post view
lib/            db adapter, posts (all SQL), hash, ids, actions
schema.sql      the one table, for reading
```

## run it

```
npm install
npm run dev
```

With no `DATABASE_URL` set, the site uses PGlite and keeps its data in `.data/` (git-ignored). Delete that folder to start clean.

Deployed on Vercel without a `DATABASE_URL`, the writing page works and posting explains why it cannot save; connect a database and redeploy to switch it on.

## deploy it

1. Create a Postgres database. The quickest is Neon through the Vercel marketplace, which sets `DATABASE_URL` on the project by itself:

   ```
   vercel integration add neon --name soffy
   ```

   Any other Postgres works too: set `DATABASE_URL` to its connection string.
2. Set two more environment variables:
   - `HASH_SALT`: any long random string. It salts the daily hash of each visitor's address. Changing it later is harmless.
   - `ADMIN_KEY`: any long random string. `/admin?key=<this>` is the only door with a key.
3. Deploy (`vercel deploy --prod`, or push to the production branch). The table is created on the first request.

Generate the two secrets with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## moderation without accounts

- The cost of posting is typing: forty words minimum, no paste.
- Each visitor gets a hash of `address | date | salt`, never the address itself, and it changes daily. One post per ten minutes and five per day per hash.
- Anyone can report a post from its page. Three reports from three different daily hashes hide it.
- `/admin?key=…` lists everything, including hidden and expired posts, with hide, unhide and delete. Keep the key out of the browser history of shared machines; the site sets no cookies on principle, so the key travels in the URL.
- Expired posts are invisible immediately and physically deleted a day later, on the next write.

All the limits are in one place, `LIMITS` in `lib/posts.ts`.

## what is deliberately missing

A feed, replies, likes, follows, search, an RSS feed, an API, an archive, a timer, rich text, file import, dark mode, a second typeface, a logo, a grid. Each one was left out on purpose. The reasons are on the about page.
