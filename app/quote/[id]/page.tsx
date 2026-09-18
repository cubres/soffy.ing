import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import QuotePage from "@/components/quote-page"
import { currentQuote, quoteById } from "@/lib/quotes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "quote",
  robots: { index: false, follow: false, noarchive: true },
}

export default async function OneQuote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = quoteById(id)
  if (!quote) notFound()
  if (quote.id === currentQuote().id) redirect("/quote")
  return <QuotePage quote={quote} />
}
