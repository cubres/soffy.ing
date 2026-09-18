import Editor from "@/components/editor"
import { LIMITS } from "@/lib/posts"
import { currentQuote } from "@/lib/quotes"

// The week's quote is chosen from the clock, so this page is rendered on request, never frozen at build.
export const dynamic = "force-dynamic"

export default async function WritePage({ searchParams }: { searchParams: Promise<{ on?: string }> }) {
  const { on } = await searchParams
  const q = currentQuote()
  return (
    <Editor
      quote={{ id: q.id, text: q.text, author: q.author, source: q.source }}
      defaultOnQuote={on === "quote"}
      limits={{
        minWords: LIMITS.minWords,
        minSeconds: LIMITS.minSeconds,
        maxChars: LIMITS.maxChars,
        lifeDays: LIMITS.lifeDays,
      }}
    />
  )
}
