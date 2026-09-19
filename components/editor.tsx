"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { submitPost, type SubmitResult } from "@/lib/actions"
import { PLACEHOLDERS } from "@/lib/placeholders"
import { fmtDate } from "@/lib/time"

interface Props {
  // Set when the writer came from the week's quote. The post is then a response to it.
  quote: { id: string; text: string; author: string } | null
  limits: { minWords: number; minSeconds: number; maxChars: number; lifeDays: number }
}

type Stage = "idle" | "confirm" | "posting" | "done"

const DEFAULT_CLOCK = 30
const PAUSE_MS = 10_000
const RESTORE_CLICKS = 100

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

export default function Editor({ quote, limits }: Props) {
  const [text, setText] = useState("")
  const [clockInput, setClockInput] = useState(String(DEFAULT_CLOCK))
  const [clock, setClock] = useState(DEFAULT_CLOCK)
  const [left, setLeft] = useState(DEFAULT_CLOCK)
  const [removing, setRemoving] = useState(false)
  const [deleted, setDeleted] = useState<string | null>(null)
  const [restoreClicks, setRestoreClicks] = useState(0)
  const [note, setNote] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ id: string; expiresAt: string } | null>(null)
  const [placeholder, setPlaceholder] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [pauses, setPauses] = useState(0)

  // Refs mirror what the once-a-second clock needs, so the interval never sees stale values.
  const textRef = useRef("")
  const clockRef = useRef(DEFAULT_CLOCK)
  const leftRef = useRef(DEFAULT_CLOCK)
  const removingRef = useRef(false)
  const stageRef = useRef<Stage>("idle")
  const startedAt = useRef<number | null>(null)
  const lastKeyAt = useRef<number | null>(null)
  const pausesRef = useRef(0)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)])
  }, [])

  useEffect(() => {
    stageRef.current = stage
  }, [stage])

  // The clock. Once a second: count down while there is text and nothing else is going on; at zero, wipe.
  useEffect(() => {
    const id = setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
      if (removingRef.current || clockRef.current === 0 || textRef.current === "") return
      if (stageRef.current === "confirm" || stageRef.current === "posting") return
      leftRef.current -= 1
      setLeft(leftRef.current)
      if (leftRef.current <= 0) wipe()
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetClock() {
    leftRef.current = clockRef.current
    setLeft(clockRef.current)
  }

  function flash(message: string) {
    setNote(message)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(null), 2500)
  }

  // Every change to the page goes through here, so the process signature stays honest.
  function setBody(value: string) {
    const now = Date.now()
    if (value === "") {
      startedAt.current = null
      lastKeyAt.current = null
      pausesRef.current = 0
      setPauses(0)
      setElapsed(0)
    } else if (textRef.current === "") {
      startedAt.current = now
      lastKeyAt.current = now
      pausesRef.current = 0
      setPauses(0)
      setElapsed(0)
    } else {
      if (lastKeyAt.current !== null && now - lastKeyAt.current >= PAUSE_MS) {
        pausesRef.current += 1
        setPauses(pausesRef.current)
      }
      lastKeyAt.current = now
    }
    textRef.current = value
    setText(value)
    resetClock()
    setStage((s) => (s === "posting" ? s : "idle"))
    setError(null)
  }

  function wipe() {
    removingRef.current = true
    setRemoving(true)
    setTimeout(() => {
      const gone = textRef.current
      if (gone.trim()) {
        setDeleted(gone)
        setRestoreClicks(0)
      }
      setBody("")
      setResult(null)
      removingRef.current = false
      setRemoving(false)
    }, 2000)
  }

  function onClockChange(value: string) {
    setClockInput(value)
    const n = parseInt(value, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 3600) {
      clockRef.current = n
      setClock(n)
      resetClock()
    }
  }

  function refuse(e: React.SyntheticEvent) {
    e.preventDefault()
    flash("paste refused. everything here is typed.")
  }

  function save() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "soffy.txt"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function restore() {
    if (!deleted) return
    const clicks = restoreClicks + 1
    setRestoreClicks(clicks)
    if (clicks >= RESTORE_CLICKS) {
      setBody(deleted)
      setDeleted(null)
      setRestoreClicks(0)
    }
  }

  async function post() {
    setStage("posting")
    setError(null)
    const seconds = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : 0
    const r: SubmitResult = await submitPost({
      body: textRef.current,
      quoteId: quote ? quote.id : null,
      writeSeconds: seconds,
      pauseCount: pausesRef.current,
      clockSeconds: clockRef.current,
    })
    if (r.ok) {
      setResult({ id: r.id, expiresAt: r.expiresAt })
      setStage("done")
      resetClock()
    } else {
      setError(r.error)
      setStage("confirm")
    }
  }

  const words = countWords(text)
  const wordsShort = Math.max(0, limits.minWords - words)
  const secondsShort = Math.max(0, limits.minSeconds - elapsed)
  const hasText = text.trim() !== ""

  // Why you cannot post yet, as one short phrase; null means you can.
  let waiting: string | null = null
  if (clock === 0) waiting = "post · turn the clock on"
  else if (text.length > limits.maxChars) waiting = "post · too long"
  else if (wordsShort > 0) waiting = `post · ${wordsShort} more ${wordsShort === 1 ? "word" : "words"}`
  else if (secondsShort > 0) waiting = `post in ${mmss(secondsShort)}`

  const expiryPreview = fmtDate(new Date(Date.now() + limits.lifeDays * 86_400_000))

  return (
    <>
      <p className="muted">
        clock{" "}
        <input
          className="t"
          inputMode="numeric"
          value={clockInput}
          onChange={(e) => onClockChange(e.target.value)}
          aria-label="clock, in seconds"
        />
        s · stop for that long and it all goes
      </p>

      {quote && (
        <p className="muted">
          <i>“{quote.text}”</i> · {quote.author}
        </p>
      )}

      {removing ? (
        <p className="loss" style={{ minHeight: "62vh" }}>
          removing everything…
        </p>
      ) : (
        <textarea
          value={text}
          placeholder={placeholder}
          onChange={(e) => setBody(e.target.value)}
          onPaste={refuse}
          onDrop={refuse}
          spellCheck
          autoFocus
          aria-label="write"
        />
      )}

      <p className="between">
        <span className="muted">
          {clock === 0 ? "no clock" : `${left}s`} · {words} {words === 1 ? "word" : "words"}
          {startedAt.current !== null && ` · ${mmss(elapsed)}`}
          {pauses > 0 && ` · ${pauses} ${pauses === 1 ? "pause" : "pauses"}`}
          {note && <span className="loss"> · {note}</span>}
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
          no name, no edits, gone on {expiryPreview}.{quote && " a response to the week's quote."}{" "}
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

      {deleted && (
        <p>
          <button className="t loss" type="button" onClick={restore}>
            restore deleted text {restoreClicks}/{RESTORE_CLICKS}
          </button>
        </p>
      )}
    </>
  )
}
