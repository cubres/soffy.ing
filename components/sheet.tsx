"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useGrammar } from "@/lib/grammar/use-grammar"
import type { Issue } from "@/lib/grammar/types"
import { textLang } from "@/lib/lang"

interface Props {
  text: string
  onChange: (text: string) => void
  placeholder: string
}

// The page you write on. Under the textarea sits a copy of the text, laid out the same way and
// invisible except for the underlines, so a mistake is marked exactly where it is.
export default function Sheet({ text, onChange, placeholder }: Props) {
  const area = useRef<HTMLTextAreaElement>(null)
  const marks = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const lang = textLang(text)
  const { ready, issues, ignore, learn } = useGrammar(text, lang === "en-US")
  const [open, setOpen] = useState<{ issue: Issue; top: number; left: number } | null>(null)

  // The page grows with the writing, so the whole text is always on it and nothing scrolls inside a box.
  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    const fit = () => {
      const y = window.scrollY
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
      window.scrollTo(window.scrollX, y)
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [text])

  // Any edit makes an open suggestion stale.
  useEffect(() => setOpen(null), [text])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null)
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!sheet.current?.contains(t)) setOpen(null)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  // A click inside an underlined stretch opens its suggestions.
  function onClick() {
    const el = area.current
    if (!el || el.selectionStart !== el.selectionEnd) return setOpen(null)
    const pos = el.selectionStart
    const index = issues.findIndex((i) => i.start <= pos && pos <= i.end)
    if (index < 0) return setOpen(null)
    const mark = marks.current?.querySelector<HTMLElement>(`[data-i="${index}"]`)
    const box = sheet.current?.getBoundingClientRect()
    const rect = mark?.getClientRects()[0]
    if (!rect || !box) return
    setOpen({
      issue: issues[index],
      top: rect.bottom - box.top + 6,
      left: Math.max(0, Math.min(rect.left - box.left, box.width - 300)),
    })
  }

  // Made as if typed, so undo takes a correction back like any other edit.
  function apply(issue: Issue, replacement: string) {
    setOpen(null)
    const el = area.current
    if (!el) return
    el.focus()
    el.setSelectionRange(issue.start, issue.end)
    const typed =
      replacement === ""
        ? document.execCommand("delete", false)
        : document.execCommand("insertText", false, replacement)
    if (!typed) {
      onChange(text.slice(0, issue.start) + replacement + text.slice(issue.end))
      const caret = issue.start + replacement.length
      requestAnimationFrame(() => el.setSelectionRange(caret, caret))
    }
  }

  // The invisible copy, with each issue wrapped in an underline.
  const pieces: ReactNode[] = []
  let at = 0
  issues.forEach((issue, i) => {
    if (issue.start < at || issue.end > text.length) return
    if (issue.start > at) pieces.push(text.slice(at, issue.start))
    pieces.push(
      <span key={i} data-i={i} className={`mark ${issue.kind}`}>
        {text.slice(issue.start, issue.end) || "​"}
      </span>,
    )
    at = issue.end
  })
  pieces.push(text.slice(at) + "​")

  return (
    <div className="sheet" ref={sheet}>
      <div className="marks" ref={marks} aria-hidden>
        {pieces}
      </div>
      <textarea
        ref={area}
        value={text}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onClick={onClick}
        lang={lang}
        // Until the checker is loaded, and for Bulgarian, the browser's own spellcheck does the work.
        spellCheck={lang !== "en-US" || !ready}
        autoFocus
        aria-label="write"
      />
      {open && (
        <div className="fix" role="dialog" aria-label="suggestion" style={{ top: open.top, left: open.left }}>
          <p className="muted">{open.issue.message}</p>
          <p className="row">
            {open.issue.replacements.map((r) => (
              <button key={r} className="t fg" type="button" onClick={() => apply(open.issue, r)}>
                {r === "" ? "remove it" : r}
              </button>
            ))}
            <button
              className="t"
              type="button"
              onClick={() => {
                ignore(open.issue)
                setOpen(null)
              }}
            >
              ignore
            </button>
            {open.issue.kind === "spelling" && (
              <button
                className="t"
                type="button"
                onClick={() => {
                  learn(open.issue)
                  setOpen(null)
                }}
              >
                learn word
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
