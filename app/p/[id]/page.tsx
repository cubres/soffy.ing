import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PostView from "@/components/post"
import { report } from "@/lib/actions"
import { isId } from "@/lib/ids"
import { isNoDatabase } from "@/lib/db"
import { getPost } from "@/lib/posts"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "a post",
  robots: { index: false, follow: false, noarchive: true },
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ reported?: string }>
}) {
  const { id } = await params
  const { reported } = await searchParams
  if (!isId(id)) notFound()
  let post
  try {
    post = await getPost(id)
  } catch (error) {
    if (isNoDatabase(error)) notFound()
    throw error
  }
  if (!post) notFound()

  return (
    <>
      <PostView post={post} />
      {reported ? (
        <p className="muted">reported. a few reports from different people and it goes.</p>
      ) : (
        <form action={report}>
          <input type="hidden" name="id" value={post.id} />
          <button className="t" type="submit">
            report
          </button>
        </form>
      )}
    </>
  )
}
