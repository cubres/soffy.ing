import type { Post } from "@/lib/posts"
import { fmtDate, fmtWords } from "@/lib/time"

// A post is its text, a date, and the date it goes. Nothing else exists.
export default function PostView({ post }: { post: Post }) {
  return (
    <article>
      <div className="body">{post.body}</div>
      <p className="muted">
        {fmtDate(post.created_at)} · {fmtWords(post.word_count)} · gone on {fmtDate(post.expires_at)}
      </p>
    </article>
  )
}
