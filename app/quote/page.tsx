import type { Metadata } from "next"
import QuotePage from "@/components/quote-page"
import { currentQuote } from "@/lib/quotes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "quote",
  description: "one quote a week, from thirty years of the International Philosophy Olympiad. everyone writes on it; no one signs.",
}

export default function CurrentQuote() {
  return <QuotePage quote={currentQuote()} />
}
