import { Fragment } from "react"
import PostView from "@/components/post"
import { listPosts } from "@/lib/posts"
import { currentQuote, previousQuote, shorten, weekEnds, type Quote } from "@/lib/quotes"
import { fmtDate } from "@/lib/time"

// One quote, everyone's responses to it, no names. A symposium where only the arguments arrive.
export default async function QuotePage({ quote }: { quote: Quote }) {
  const current = currentQuote()
  const previous = previousQuote()
  const isCurrent = quote.id === current.id
  const isPrevious = quote.id === previous.id
  const posts = await listPosts({ quoteId: quote.id, limit: 100 })

  return (
    <>
      <p className="muted">
        {isCurrent ? `this week's quote · until ${fmtDate(weekEnds())}` : isPrevious ? "last week's quote" : "an earlier quote"}
        {" · "}
        International Philosophy Olympiad, {quote.place} {quote.year}
      </p>
      <blockquote>“{quote.text}”</blockquote>
      <p>
        {quote.author}
        {quote.source && (
          <>
            , <i>{quote.source}</i>
          </>
        )}
      </p>
      {(isCurrent || isPrevious) && (
        <p>
          <a href="/?on=quote">[write on it]</a>
          {isPrevious && <span className="muted"> · responses to last week's quote are still welcome</span>}
        </p>
      )}

      <p className="sep">· · ·</p>

      {posts.length === 0 ? (
        <p className="muted">no responses yet. be the first, and the only one who knows it was you.</p>
      ) : (
        posts.map((post, i) => (
          <Fragment key={post.id}>
            {i > 0 && <p className="sep">· · ·</p>}
            <PostView post={post} excerpt />
          </Fragment>
        ))
      )}

      {isCurrent && (
        <>
          <p className="sep">· · ·</p>
          <p className="muted">
            last week: <a href={`/quote/${previous.id}`}>“{shorten(previous.text, 80)}”</a> · {previous.author}
          </p>
        </>
      )}
    </>
  )
}
