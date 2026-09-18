import type { Post } from "@/lib/posts"
import { quoteById, shorten } from "@/lib/quotes"
import { fmtClock, fmtDate, fmtMinutes, fmtWords, plural } from "@/lib/time"

const EXCERPT_CHARS = 900

function clip(body: string): { text: string; cut: boolean } {
  if (body.length <= EXCERPT_CHARS) return { text: body, cut: false }
  const window = body.slice(0, EXCERPT_CHARS)
  const at = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(" "))
  return { text: body.slice(0, at > EXCERPT_CHARS / 2 ? at : EXCERPT_CHARS), cut: true }
}

// A post is its text, and one line of what the clock measured. Nothing else exists.
export default function PostView({ post, excerpt = false }: { post: Post; excerpt?: boolean }) {
  const quote = post.quote_id ? quoteById(post.quote_id) : undefined
  const { text, cut } = excerpt ? clip(post.body) : { text: post.body, cut: false }
  return (
    <article>
      {quote && (
        <p className="muted">
          on the quote <a href={`/quote/${quote.id}`}>“{shorten(quote.text, 80)}”</a> · {quote.author}
        </p>
      )}
      <div className="body">
        {text}
        {cut && "…"}
      </div>
      <p className="muted">
        {cut && (
          <>
            <a href={`/p/${post.id}`}>[continue]</a> ·{" "}
          </>
        )}
        {fmtDate(post.created_at)} · {fmtWords(post.word_count)} · written in {fmtMinutes(post.write_seconds)} under a{" "}
        {fmtClock(post.clock_seconds)} clock
        {post.pause_count > 0 && `, ${plural(post.pause_count, "pause")}`} · vanishes {fmtDate(post.expires_at)}
      </p>
    </article>
  )
}
