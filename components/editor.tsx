"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { submitPost, type SubmitResult } from "@/lib/actions"
import { PLACEHOLDERS } from "@/lib/placeholders"
import { fmtDate, plural } from "@/lib/time"

interface QuoteInfo {
  id: string
  text: string
  author: string
  source: string
}

interface Limits {
  minWords: number
  minSeconds: number
  maxChars: number
  lifeDays: number
}

interface Props {
  quote: QuoteInfo
  defaultOnQuote: boolean
  limits: Limits
}

type Stage = "idle" | "confirm" | "posting" | "done"

const DEFAULT_CLOCK = 30
const PAUSE_MS = 10_000
const RESTORE_CLICKS = 100

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// Enough RTF to get the words back out of a file this site once exported. Everything else is dropped.
function rtfToText(rtf: string): string {
  let out = ""
  let i = 0
  let depth = 0
  let skipUntilDepth = -1
  const skipGroups = /^\\(\*|fonttbl|colortbl|stylesheet|info|pict|themedata|listtable)/
  while (i < rtf.length) {
    const ch = rtf[i]
    if (ch === "{") {
      depth++
      i++
      if (skipUntilDepth < 0 && skipGroups.test(rtf.slice(i, i + 14))) skipUntilDepth = depth
      continue
    }
    if (ch === "}") {
      if (skipUntilDepth === depth) skipUntilDepth = -1
      depth--
      i++
      continue
    }
    if (ch === "\\") {
      const next = rtf[i + 1]
      if (next === "'") {
        const code = parseInt(rtf.substr(i + 2, 2), 16)
        if (skipUntilDepth < 0 && !Number.isNaN(code)) out += String.fromCharCode(code)
        i += 4
        continue
      }
      const word = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(i))
      if (word) {
        const [, name, param] = word
        i += word[0].length
        if (skipUntilDepth >= 0) continue
        if (name === "par" || name === "line") out += "\n"
        else if (name === "tab") out += "\t"
        else if (name === "u" && param) {
          out += String.fromCharCode(parseInt(param, 10))
          if (rtf[i] === "\\" && rtf[i + 1] === "'") i += 4
          else if (rtf[i] === "?") i += 1
        }
        continue
      }
      if (skipUntilDepth < 0 && next !== undefined) out += next
      i += 2
      continue
    }
    if (ch === "\r" || ch === "\n") {
      i++
      continue
    }
    if (skipUntilDepth < 0) out += ch
    i++
  }
  return out.trim()
}

export default function Editor({ quote, defaultOnQuote, limits }: Props) {
  const [text, setText] = useState("")
  const [clockInput, setClockInput] = useState(String(DEFAULT_CLOCK))
  const [clock, setClock] = useState(DEFAULT_CLOCK)
  const [locked, setLocked] = useState(false)
  const [left, setLeft] = useState(DEFAULT_CLOCK)
  const [removing, setRemoving] = useState(false)
  const [deleted, setDeleted] = useState<string | null>(null)
  const [restoreClicks, setRestoreClicks] = useState(0)
  const [imported, setImported] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [onQuote, setOnQuote] = useState(defaultOnQuote)
  const [stage, setStage] = useState<Stage>("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ id: string; expiresAt: string } | null>(null)
  const [placeholder, setPlaceholder] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [pauses, setPauses] = useState(0)

  // Refs mirror the state the once-a-second clock needs, so the interval never sees stale values.
  const textRef = useRef("")
  const clockRef = useRef(DEFAULT_CLOCK)
  const leftRef = useRef(DEFAULT_CLOCK)
  const removingRef = useRef(false)
  const stageRef = useRef<Stage>("idle")
  const startedAt = useRef<number | null>(null)
  const lastKeyAt = useRef<number | null>(null)
  const pausesRef = useRef(0)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)

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
  function setBody(value: string, viaImport = false) {
    const now = Date.now()
    if (value === "") {
      startedAt.current = null
      lastKeyAt.current = null
      pausesRef.current = 0
      setPauses(0)
      setElapsed(0)
      setImported(false)
    } else if (textRef.current === "") {
      startedAt.current = now
      lastKeyAt.current = now
      pausesRef.current = 0
      setPauses(0)
      setElapsed(0)
      setImported(viaImport)
    } else {
      if (lastKeyAt.current !== null && now - lastKeyAt.current >= PAUSE_MS) {
        pausesRef.current += 1
        setPauses(pausesRef.current)
      }
      lastKeyAt.current = now
      if (viaImport) setImported(true)
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
    if (locked) return
    setClockInput(value)
    const n = parseInt(value, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 3600) {
      clockRef.current = n
      setClock(n)
      resetClock()
    }
  }

  function refuse(e: React.SyntheticEvent, what: string) {
    e.preventDefault()
    flash(`${what} refused. everything here is typed.`)
  }

  function importFile() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".txt,.rtf,.md"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const raw = await file.text()
      const plain = file.name.toLowerCase().endsWith(".rtf") ? rtfToText(raw) : raw
      setBody(plain, true)
      areaRef.current?.focus()
    }
    input.click()
  }

  function downloadTxt() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "soffy.txt"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function downloadPdf() {
    const w = window.open("", "_blank")
    if (!w) {
      flash("allow pop-ups to print to pdf")
      return
    }
    w.document.write(
      `<!doctype html><html><head><title>soffy.ing</title><style>body{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12pt;line-height:1.6;color:#000;background:#fff;margin:0;padding:1in;white-space:pre-wrap;overflow-wrap:anywhere}@page{margin:1in}</style></head><body>${escapeHtml(text)}</body></html>`,
    )
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 150)
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
      quoteId: onQuote ? quote.id : null,
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
  const reasons: string[] = []
  if (imported) reasons.push("imported text cannot be posted. everything posted here was typed here")
  if (clock === 0) reasons.push("the clock is off")
  if (words < limits.minWords) reasons.push(`needs ${limits.minWords - words} more words`)
  if (elapsed < limits.minSeconds) reasons.push(`needs ${limits.minSeconds - elapsed} s more under the clock`)
  if (text.length > limits.maxChars) reasons.push("too long")
  const eligible = text.trim() !== "" && reasons.length === 0
  const expiryPreview = fmtDate(new Date(Date.now() + limits.lifeDays * 86_400_000))

  return (
    <>
      <p className="row">
        <span>
          clock{" "}
          <input
            className="t"
            inputMode="numeric"
            value={clockInput}
            disabled={locked}
            onChange={(e) => onClockChange(e.target.value)}
            aria-label="clock, in seconds"
          />{" "}
          s
        </span>
        <button className="t" type="button" onClick={() => setLocked((l) => !l)}>
          {locked ? "[unlock]" : "[lock]"}
        </button>
        <span className="muted">stop typing for that long and everything goes. 0 turns it off.</span>
      </p>

      {onQuote && (
        <p className="muted">
          <i>“{quote.text}”</i> · {quote.author}
        </p>
      )}

      {removing ? (
        <p className="loss" style={{ minHeight: "60vh" }}>
          [removing everything…]
        </p>
      ) : (
        <textarea
          ref={areaRef}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setBody(e.target.value)}
          onPaste={(e) => refuse(e, "paste")}
          onDrop={(e) => refuse(e, "drop")}
          spellCheck
          autoFocus
          aria-label="write"
        />
      )}

      <p className="row">
        <span>{clock === 0 ? "[no clock]" : `[${left} s]`}</span>
        <span>{plural(words, "word")}</span>
        {startedAt.current !== null && (
          <span>
            {Math.floor(elapsed / 60)} min {elapsed % 60} s
          </span>
        )}
        {pauses > 0 && <span>{plural(pauses, "pause")}</span>}
        {note && <span className="loss">{note}</span>}
      </p>

      <p className="row">
        <button className="t" type="button" onClick={importFile}>
          [import .txt/.rtf]
        </button>
        <button className="t" type="button" onClick={downloadTxt} disabled={!text}>
          [download .txt]
        </button>
        <button className="t" type="button" onClick={downloadPdf} disabled={!text}>
          [download .pdf]
        </button>
        {stage === "idle" &&
          (eligible ? (
            <button className="t" type="button" onClick={() => setStage("confirm")}>
              [post]
            </button>
          ) : (
            text.trim() !== "" && <span className="off">post · {reasons[0]}</span>
          ))}
      </p>

      {(stage === "confirm" || stage === "posting") && (
        <div>
          <p>
            this will be posted with no name. it cannot be edited or deleted. it vanishes on {expiryPreview}.
            <br />
            the site keeps nothing about you and will not keep a copy for you. download one first if you want it.
            <br />
            the clock is paused while you decide.
          </p>
          <p>
            <button className="t" type="button" onClick={() => setOnQuote((q) => !q)} disabled={stage === "posting"}>
              {onQuote ? "[x]" : "[ ]"}
            </button>{" "}
            a response to this week's quote
          </p>
          {error && <p className="loss">{error}</p>}
          <p className="row">
            {stage === "posting" ? (
              <span className="off">posting…</span>
            ) : (
              <button className="t" type="button" onClick={post}>
                [post it]
              </button>
            )}
            <button className="t" type="button" onClick={() => setStage("idle")} disabled={stage === "posting"}>
              [not yet]
            </button>
          </p>
        </div>
      )}

      {stage === "done" && result && (
        <p>
          posted. it lives at <a href={`/p/${result.id}`}>soffy.ing/p/{result.id}</a> until {fmtDate(result.expiresAt)}.
          the clock is running again.
        </p>
      )}

      {deleted && (
        <p>
          <button className="t loss" type="button" onClick={restore}>
            [restore deleted text: {restoreClicks}/{RESTORE_CLICKS}]
          </button>
        </p>
      )}
    </>
  )
}
