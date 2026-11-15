// One thing the checker found: where it is, what is wrong, and what could replace it.
// Offsets are UTF-16 indices into the text, the same ones a textarea's selection uses.
export interface Issue {
  start: number
  end: number
  kind: "spelling" | "grammar"
  message: string
  // Each is the full text that would stand in place of text.slice(start, end).
  replacements: string[]
}

export type ToWorker = { id: number; text: string; words: string[] }
export type FromWorker = { id: number; issues: Issue[] } | { ready: true } | { failed: string }
