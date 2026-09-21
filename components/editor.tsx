"use client"

import { useState } from "react"
import { submitPost, type SubmitResult } from "@/lib/actions"
import { fmtDate } from "@/lib/time"

interface Props {
  limits: { minWords: number; maxChars: number; lifeDays: number }
}

type Stage = "idle" | "confirm" | "posting" | "done"

// What the empty page says.
const PLACEHOLDER = "Statues made of gold are always hollow"

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function Editor({ limits }: Props) {
  const [text, setText] = useState("")
  const [stage, setStage] = useState<Stage>("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ id: string; expiresAt: string } | null>(null)

  function onChange(value: string) {
    setText(value)
    setStage((s) => (s === "posting" ? s : "idle"))
    setError(null)
  }

  function save() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "soffy.txt"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function post() {
    setStage("posting")
    setError(null)
    const r: SubmitResult = await submitPost(text)
    if (r.ok) {
      setResult({ id: r.id, expiresAt: r.expiresAt })
      setStage("done")
    } else {
      setError(r.error)
      setStage("confirm")
    }
  }

  const words = countWords(text)
  const wordsShort = Math.max(0, limits.minWords - words)
  const hasText = text.trim() !== ""

  // Why you cannot post yet, as one short phrase; null means you can.
  let waiting: string | null = null
  if (text.length > limits.maxChars) waiting = "post · too long"
  else if (wordsShort > 0) waiting = `post · ${wordsShort} more ${wordsShort === 1 ? "word" : "words"}`

  const expiryPreview = fmtDate(new Date(Date.now() + limits.lifeDays * 86_400_000))

  return (
    <>
      <textarea
        value={text}
        placeholder={PLACEHOLDER}
        onChange={(e) => onChange(e.target.value)}
        spellCheck
        autoFocus
        aria-label="write"
      />

      <p className="between">
        <span className="muted">
          {words} {words === 1 ? "word" : "words"}
        </span>
        {hasText && stage === "idle" && (
          <span className="row">
            <button className="t" type="button" onClick={save}>
              save
            </button>
            {waiting === null ? (
              <button className="t fg" type="button" onClick={() => setStage("confirm")}>
                post
              </button>
            ) : (
              <span className="muted">{waiting}</span>
            )}
          </span>
        )}
      </p>

      {(stage === "confirm" || stage === "posting") && (
        <p>
          no name, no edits, gone on {expiryPreview}.{" "}
          {stage === "posting" ? (
            <span className="muted">posting…</span>
          ) : (
            <>
              <button className="t fg" type="button" onClick={post}>
                yes
              </button>
              <span className="muted"> · </span>
              <button className="t" type="button" onClick={() => setStage("idle")}>
                no
              </button>
            </>
          )}
          {error && (
            <>
              <br />
              <span className="loss">{error}</span>
            </>
          )}
        </p>
      )}

      {stage === "done" && result && (
        <p>
          posted. <a href={`/p/${result.id}`}>soffy.ing/p/{result.id}</a>
          <span className="muted"> · gone on {fmtDate(result.expiresAt)}</span>
        </p>
      )}
    </>
  )
}
