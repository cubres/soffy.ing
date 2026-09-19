import { Fragment } from "react"
import PostView from "@/components/post"
import NotConnected from "@/components/not-connected"
import { isNoDatabase } from "@/lib/db"
import { listPosts } from "@/lib/posts"
import { currentQuote, previousQuote, shorten, weekEnds, type Quote } from "@/lib/quotes"
import { fmtDate } from "@/lib/time"

// One quote, everyone's responses to it, no names. A symposium where only the arguments arrive.
export default async function QuotePage({ quote }: { quote: Quote }) {
  const current = currentQuote()
  const previous = previousQuote()
  const isCurrent = quote.id === current.id
  const isPrevious = quote.id === previous.id
  let posts: Awaited<ReturnType<typeof listPosts>> = []
  let connected = true
  try {
    posts = await listPosts({ quoteId: quote.id, limit: 100 })
  } catch (error) {
    if (!isNoDatabase(error)) throw error
    connected = false
  }

  return (
    <>
      <p className="muted">
        {isCurrent ? `this week, until ${fmtDate(weekEnds())}` : isPrevious ? "last week" : "an earlier week"} ·
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
          <a href="/?on=quote">write on it</a>
        </p>
      )}

      <p className="sep">· · ·</p>

      {!connected ? (
        <NotConnected />
      ) : posts.length === 0 ? (
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
            last week: <a href={`/quote/${previous.id}`}>“{shorten(previous.text, 72)}”</a> · {previous.author}
          </p>
        </>
      )}
    </>
  )
}
