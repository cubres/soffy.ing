"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FromWorker, Issue, ToWorker } from "./types"

const WORDS_KEY = "soffy.words"

function loadWords(): string[] {
  try {
    const raw = localStorage.getItem(WORDS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveWords(words: string[]) {
  try {
    localStorage.setItem(WORDS_KEY, JSON.stringify(words))
  } catch {}
}

// Issues were found in `from`; carry them over to `to` by moving the ones after the edit
// and dropping the ones the edit touched. Keeps underlines in place while the checker catches up.
function carry(from: string, to: string, issues: Issue[]): Issue[] {
  if (from === to) return issues
  const max = Math.min(from.length, to.length)
  let p = 0
  while (p < max && from[p] === to[p]) p++
  let s = 0
  while (s < max - p && from[from.length - 1 - s] === to[to.length - 1 - s]) s++
  const editEnd = from.length - s
  const delta = to.length - from.length
  const out: Issue[] = []
  for (const i of issues) {
    if (i.end < p) out.push(i)
    else if (i.start > editEnd) out.push({ ...i, start: i.start + delta, end: i.end + delta })
  }
  return out
}

const key = (text: string, i: Issue) => `${text.slice(i.start, i.end)}\u0000${i.message}`

// Spelling and grammar for `text`, checked in a worker on this device. Off when `on` is false.
export function useGrammar(text: string, on: boolean) {
  const worker = useRef<Worker | null>(null)
  const sent = useRef(new Map<number, string>())
  const nextId = useRef(0)
  const [ready, setReady] = useState(false)
  const [found, setFound] = useState<{ text: string; issues: Issue[] }>({ text: "", issues: [] })
  const [ignored, setIgnored] = useState<Set<string>>(() => new Set())
  const [words, setWords] = useState<string[]>([])

  // Start the checker once the page is idle. It is large, so it loads after the page, not with it.
  useEffect(() => {
    setWords(loadWords())
    let w: Worker | null = null
    const start = () => {
      try {
        w = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
      } catch {
        return
      }
      w.onmessage = (e: MessageEvent<FromWorker>) => {
        const m = e.data
        if ("ready" in m) setReady(true)
        else if ("failed" in m) console.warn("soffy: checker failed:", m.failed)
        else {
          const base = sent.current.get(m.id)
          for (const id of sent.current.keys()) if (id <= m.id) sent.current.delete(id)
          if (base !== undefined) setFound({ text: base, issues: m.issues })
        }
      }
      worker.current = w
    }
    const t = setTimeout(start, 800)
    return () => {
      clearTimeout(t)
      w?.terminate()
      worker.current = null
    }
  }, [])

  // Re-check a moment after typing stops.
  useEffect(() => {
    if (!on || !ready || !worker.current) return
    const t = setTimeout(() => {
      const id = ++nextId.current
      sent.current.set(id, text)
      worker.current?.postMessage({ id, text, words } satisfies ToWorker)
    }, 250)
    return () => clearTimeout(t)
  }, [text, on, ready, words])

  const issues = useMemo(() => {
    if (!on) return []
    return carry(found.text, text, found.issues).filter((i) => !ignored.has(key(text, i)))
  }, [on, found, text, ignored])

  const ignore = useCallback((i: Issue) => setIgnored((s) => new Set(s).add(key(text, i))), [text])

  const learn = useCallback(
    (i: Issue) => {
      const word = text.slice(i.start, i.end)
      setWords((w) => {
        const next = [...new Set([...w, word])]
        saveWords(next)
        return next
      })
      setIgnored((s) => new Set(s).add(key(text, i)))
    },
    [text],
  )

  return { ready, issues, ignore, learn }
}
