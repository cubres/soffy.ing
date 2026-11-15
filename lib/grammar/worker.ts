// The checker, running in its own thread so typing never waits for it.
// Everything happens here, in this browser: Harper is compiled to WebAssembly and
// shipped with the site, and the text is never sent anywhere.

import { Dialect, LocalLinter, SuggestionKind, type Lint } from "harper.js"
import { binary } from "harper.js/binary"
import { extraRules } from "./rules"
import type { FromWorker, Issue, ToWorker } from "./types"

const post = (m: FromWorker) => (self as unknown as Worker).postMessage(m)

const linter = new LocalLinter({ binary, dialect: Dialect.American })
let known = ""

const ready = (async () => {
  await linter.setup()
  // A writer's long sentences are not mistakes, and swearing is a choice.
  await linter.setLintConfig({ ...(await linter.getLintConfig()), LongSentences: false, AvoidCurses: false })
})()

ready.then(
  () => post({ ready: true }),
  (e) => post({ failed: String(e) }),
)

function toIssue(lint: Lint): Issue {
  const span = lint.span()
  const problem = lint.get_problem_text()
  const replacements = lint.suggestions().map((s) => {
    const kind = s.kind()
    if (kind === SuggestionKind.Remove) {
      s.free()
      return ""
    }
    const text = kind === SuggestionKind.Replace ? s.get_replacement_text() : problem + s.get_replacement_text()
    s.free()
    return text
  })
  const kindName = lint.lint_kind()
  const issue: Issue = {
    start: span.start,
    end: span.end,
    kind: kindName === "Spelling" || kindName === "Typo" ? "spelling" : "grammar",
    message: lint.message().replace(/`([^`]+)`/g, "“$1”"),
    replacements: [...new Set(replacements)].slice(0, 4),
  }
  lint.free() // the lint lives in WebAssembly memory until freed
  return issue
}

let pending: ToWorker | null = null
let busy = false

async function run() {
  if (busy || !pending) return
  busy = true
  const { id, text, words } = pending
  pending = null
  try {
    await ready
    const key = words.join("\n")
    if (key !== known) {
      await linter.clearWords()
      if (words.length) await linter.importWords(words)
      known = key
    }
    const harper = (await linter.lint(text, { language: "plaintext" })).map(toIssue)
    const extra = extraRules(text)
    // Harper first; a rule of ours only adds what Harper did not already mark.
    const issues = [...harper]
    for (const e of extra) {
      if (!issues.some((h) => e.start < h.end && h.start < e.end)) issues.push(e)
    }
    issues.sort((a, b) => a.start - b.start)
    post({ id, issues })
  } catch (e) {
    post({ failed: String(e) })
  }
  busy = false
  run()
}

self.onmessage = (e: MessageEvent<ToWorker>) => {
  pending = e.data // only the newest text matters
  run()
}
