import type { Metadata } from "next"
import { Fragment } from "react"
import PostView from "@/components/post"
import { listPosts } from "@/lib/posts"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "read",
  robots: { index: false, follow: false, noarchive: true },
}

const PAGE = 20

export default async function ReadPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const { before } = await searchParams
  const posts = await listPosts({ before: before ? new Date(before) : undefined, limit: PAGE })

  if (posts.length === 0) {
    return (
      <p className="muted">
        {before ? "nothing older than this." : "nothing here yet."} <a href="/">[write]</a> something.
      </p>
    )
  }

  const last = posts[posts.length - 1]
  return (
    <>
      {posts.map((post, i) => (
        <Fragment key={post.id}>
          {i > 0 && <p className="sep">· · ·</p>}
          <PostView post={post} excerpt />
        </Fragment>
      ))}
      {posts.length === PAGE && (
        <p>
          <a href={`/read?before=${encodeURIComponent(new Date(last.created_at).toISOString())}`}>[older]</a>
        </p>
      )}
    </>
  )
}
