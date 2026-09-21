import Editor from "@/components/editor"
import { LIMITS } from "@/lib/posts"

export default function WritePage() {
  return <Editor limits={{ minWords: LIMITS.minWords, maxChars: LIMITS.maxChars, lifeDays: LIMITS.lifeDays }} />
}
