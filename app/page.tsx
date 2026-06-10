"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

const WRITING_QUOTES = [
  "A novel is never anything but a philosophy expressed in images.",
  "Art must be an axe for the frozen sea inside us.",
  "One must still have chaos in oneself to give birth to a dancing star.",
  "What would life be if we had no courage to attempt anything?",
  "In the depth of winter, I found there was, within me, an invincible summer.",
  "If just being born is the greatest act of creation, then what are you supposed to do after that? Isn't everything that comes next sort of a disappointment? Slowly entropying until we devolve into a pile of mush?",
  "I'm not human; I'm an idea that you cannot kill.",
  "I just want to fly, Deadalus, I HAVE TO TRY~",
  "NO, DON'T BE A FOOL, ICARUS YOU FLEW TOO HIGH~",
  "I, tried, just know a human put in that work one time; all this drawing at a table tend to hurt my spine, open up my jaw and they avert they eyes",
  "Everybody who says you can't do it, fuck em. Fuck everyone who puts you down, fuck everyone who tells you who you are because you're you.",
  "Fuck the left wing and fuck the right too; two paths to evil is your eagle red or blue; pull up with the deagle, loud toy inside my shoe; I'm a cowboy, and there ain't space enough for you",
  "How the fuck did we ever put a stick in the moon?",
  "Fuck your wars for money, for economy, autonomy is dying, and a lot of me believes it, leave it in the past, keep buying more gas, keep starting your wars keep sending more tours to Afghanistan and Taliban hand to hand to fight 'em now I understand?",
  "No one really wants to die alone, but some of us will try.",
  "Know that after this is done, you will be with me and I will be with you and everything will be with everything because we are all made from the same things and we will all go back to the same place.",
  "Keep my pride on my hip, that's a weapon I can't lose - bitch - why won't you choose to-to love everybody?",
  "IM ON THE EDGE OF THE WORLD, WITH MY FEET OFF OF THE SIDE, NO ONE REALLY WANTS TO DIE ALONE BUT SOME OF US WILL TRY~",
  "I have an erection, I have no direction.",
  "You are God above a white page",
  "I am God, so why would I pray?",
  "There will always be a clown here to fake a smile for you",
  "DANCE for the people, DANCE like you mean it-",
  "Instead of putting on your makeup tryna makeup for the time our life can take up do what the fuck you wanna do, please.",
  "Try as you might but you'll be taken away; nothing matters unless you make it, don't depend on shit to give you meaning",
  "Letting the cop slip on the cuffs and if he doing it too rough I look at momma like whatever make her cry one too many a time - she see me grow colder as I'm getting older, I told her, It's fine. I hold her, she blind from the tears in her eyes; she want me to find my life in these rhymes in my head in a line, my pain and my strife. Every moment, my life closing in on me, why? Do I feel the need to do more than these others? 'Cause in this life I've lost some brothers, that's why.",
  "It's okay for music to not be about anything",
  "There are two kinds of people in this world: those who are born with worth, and everybody else. No matter how hard a lowly human tries, they will never be the same as someone who was born worthy… They say that 'effort breeds success'… But that's a complete lie. The world is not that accommodating.",
  "The deeper and darker the despair… the brighter and powerful the hope born from it.",
  "I believe my actions will become the foundation of this world's hope. And… if that really happens… Praise me. Tell others what I’ve accomplished. Erect a bronze statue of me. Respect me. Please call me… the Ultimate Hope.",
  "A love where you lick at each other wounds is just pitiful.",
  "I want to make your life miserable",
  "Why climb a mountain when you'll rot up there alone?",
  "People are free. Well, they can't fly on their own ... but pretty much whatever they can think up, they can make happen. When they're sleepy, they can sleep. They're free to start or quit whatever they're doing whenever they want. And the only reason they don't is because things like social norms, laws, traditions and sentiment get in the way.",
  "...being so excessively happy makes you insecure; makes you wonder how long the good days will last. True happiness is a fleeting thing. So, maybe, we're meant to go all out and enjoy it while we can.",
  "There’s a loneliness that’s part of living as a human being that you can never get rid of. If, no matter how much people seek or hurt each other, they can never find full understanding with one another, then what are they supposed to believe in, you know?",
  "I think that what people who've committed crimes needs isn't punishment, but rather the knowledge of the pain of being forgiven",
  "Instead of trying to be satisfied on just one answer and blocking the rest, searching for more answers despite the pain they may bring, is a much more honest way of living",
  "May you never forget me.",
  "You’ve got to keep on living, no matter what… …please believe me when I say, that there’ll come a time when you’ll be glad that you’re alive",
  "Don’t walk in front of me… I may not follow. Don’t walk behind me… I may not lead. Walk beside me… just be my friend",
  "Live to the point of tears."
]

interface Quote {
  text: string
  author?: string
  language?: "en" | "bg" // Added language field to distinguish quote types
}

async function fetchEnglishQuotes(): Promise<Quote[]> {
  try {
    const response = await fetch("/images/ipo-quotes.csv")
    const text = await response.text()
    const lines = text.split("\n").filter((line) => line.trim())
    const quotes: Quote[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const columns: string[] = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          columns.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      columns.push(current.trim())

      let maxSpaces = -1
      let quoteText = ""

      for (const col of columns) {
        const cleaned = col.replace(/^"|"$/g, "").replace(/""/g, '"').trim()
        const spaceCount = (cleaned.match(/ /g) || []).length
        if (spaceCount > maxSpaces) {
          maxSpaces = spaceCount
          quoteText = cleaned
        }
      }

      if (quoteText) {
        quotes.push({
          text: quoteText,
          author: undefined,
          language: "en",
        })
      }
    }
    return quotes
  } catch (error) {
    console.error("[v0] Failed to fetch English quotes:", error)
    return []
  }
}

async function fetchBulgarianQuotes(): Promise<Quote[]> {
  try {
    const response = await fetch("/images/bulgarian-philosophy-olympiad-quotes.csv")
    const text = await response.text()
    const lines = text.split("\n").filter((line) => line.trim())
    const quotes: Quote[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const columns: string[] = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          columns.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      columns.push(current.trim())

      // Bulgarian CSV: Year, Stage, AgeGroup, Quote, Author, Notes, SourceCitation
      // Quote is at index 3
      if (columns.length > 3) {
        const quoteText = columns[3].replace(/^"|"$/g, "").replace(/""/g, '"').trim()
        const author = columns.length > 4 ? columns[4].replace(/^"|"$/g, "").trim() : undefined

        if (quoteText) {
          quotes.push({
            text: quoteText,
            author: author,
            language: "bg",
          })
        }
      }
    }
    return quotes
  } catch (error) {
    console.error("[v0] Failed to fetch Bulgarian quotes:", error)
    return []
  }
}

function getNextWritingDay(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next = new Date(today)
  next.setDate(next.getDate() + 1)

  while (next.getDay() !== 0 && next.getDay() !== 4) {
    next.setDate(next.getDate() + 1)
  }
  return next
}

function getDaysUntilNextWriting(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next = getNextWritingDay()
  const diffTime = next.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getNextQuoteText(): string {
  const days = getDaysUntilNextWriting()
  if (days === 0) return "See today's quote"
  if (days === 1) return "See quote for tomorrow"
  return `See quote in ${days} days`
}

function getQuoteIndexForDate(date: Date, englishQuotes: number, bulgarianQuotes: number): number {
  const day = date.getDay()
  const totalQuotes = day === 0 ? englishQuotes : bulgarianQuotes // Sunday = English, Thursday = Bulgarian

  if (totalQuotes === 0) return -1
  const baseDate = new Date("2025-10-19") // First Sunday starting point
  baseDate.setHours(0, 0, 0, 0)
  let writingDayCount = 0
  const tempDate = new Date(baseDate)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  // Count writing days of the same type (Sunday or Thursday) from base date
  while (tempDate <= targetDate) {
    const tempDay = tempDate.getDay()
    if (tempDay === day) {
      writingDayCount++
    }
    tempDate.setDate(tempDate.getDate() + 1)
  }

  return (writingDayCount - 1) % totalQuotes
}

export default function WritingApp() {
  const [text, setText] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [shutdownTime, setShutdownTime] = useState(30)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isPaused, setIsPaused] = useState(false)
  const [deletedText, setDeletedText] = useState("")
  const [restoreClicks, setRestoreClicks] = useState(0)
  const [showRestoreButton, setShowRestoreButton] = useState(false)
  const [customTimer, setCustomTimer] = useState("30")
  const [isTimerLocked, setIsTimerLocked] = useState(false)
  const [placeholderQuote, setPlaceholderQuote] = useState("")
  const [isRemoving, setIsRemoving] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [englishQuotes, setEnglishQuotes] = useState<Quote[]>([])
  const [bulgarianQuotes, setBulgarianQuotes] = useState<Quote[]>([])
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log("[v0] Component mounted")
    const randomIndex = Math.floor(Math.random() * WRITING_QUOTES.length)
    setPlaceholderQuote(WRITING_QUOTES[randomIndex])

    Promise.all([fetchEnglishQuotes(), fetchBulgarianQuotes()])
      .then(([english, bulgarian]) => {
        console.log("[v0] Fetched English quotes:", english.length)
        console.log("[v0] Fetched Bulgarian quotes:", bulgarian.length)
        setEnglishQuotes(english)
        setBulgarianQuotes(bulgarian)

        if (english.length > 0 || bulgarian.length > 0) {
          const nextDay = getNextWritingDay()
          console.log("[v0] Next writing day:", nextDay)
          const dayOfWeek = nextDay.getDay()
          const isSunday = dayOfWeek === 0
          const quotes = isSunday ? english : bulgarian
          const quoteIndex = getQuoteIndexForDate(nextDay, english.length, bulgarian.length)
          console.log("[v0] Quote index for next day:", quoteIndex)

          if (quoteIndex >= 0 && quoteIndex < quotes.length) {
            const quote = quotes[quoteIndex]
            console.log("[v0] Setting next quote:", quote)
            // setNextQuote(quote)
            // const quoteText = getNextQuoteText()
            // console.log("[v0] Quote text:", quoteText)
            // setNextQuoteText(quoteText)
          } else {
            console.log("[v0] Invalid quote index:", quoteIndex)
          }
        } else {
          console.log("[v0] No quotes fetched")
        }
      })
      .catch((error) => {
        console.error("[v0] Error loading quotes:", error)
      })
  }, [])

  useEffect(() => {
    const plainText = editorRef.current?.innerText || ""
    const trimmedText = plainText.trim()
    const count = trimmedText.split(/\s+/).filter((word) => word.length > 0).length
    setWordCount(count)
  }, [text])

  useEffect(() => {
    if (isPaused || shutdownTime === 0) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRemoving(true)
          setTimeout(() => {
            const currentContent = editorRef.current?.innerHTML || ""
            if (currentContent.trim().length > 0 && editorRef.current?.innerText?.trim()) {
              setDeletedText(currentContent)
              setShowRestoreButton(true)
              setRestoreClicks(0)
            }
            if (editorRef.current) {
              editorRef.current.innerHTML = ""
            }
            setText("")
            setIsRemoving(false)
          }, 2000)
          return shutdownTime
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPaused, shutdownTime, text])

  const handleTextChange = () => {
    setText(editorRef.current?.innerHTML || "")
    if (shutdownTime > 0) {
      setTimeLeft(shutdownTime)
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const handleDownload = () => {
    const htmlContent = editorRef.current?.innerHTML || ""
    let rtfContent = "{\\rtf1\\ansi\\deff0 "

    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = htmlContent

    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || ""
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const tagName = element.tagName.toLowerCase()
        let content = ""

        element.childNodes.forEach((child) => {
          content += processNode(child)
        })

        if (tagName === "b" || tagName === "strong") {
          return `{\\b ${content}}`
        } else if (tagName === "i" || tagName === "em") {
          return `{\\i ${content}}`
        } else if (tagName === "br") {
          return "\\par "
        } else if (tagName === "div" || tagName === "p") {
          return content + "\\par "
        }

        return content
      }
      return ""
    }

    rtfContent += processNode(tempDiv)
    rtfContent += "}"

    const blob = new Blob([rtfContent], { type: "application/rtf" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "creation.rtf"
    link.click()
  }

  const handleDownloadPDF = () => {
    const htmlContent = editorRef.current?.innerHTML || ""
    
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups to download PDF")
      return
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Export</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.5;
              color: black;
              background: white;
              padding: 1in;
              margin: 0;
            }
            * {
              color: black !important;
              background: white !important;
            }
            @media print {
              @page { margin: 1in; }
            }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `)
    printWindow.document.close()
    
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  const handleImportRTF = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".rtf,.txt"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const text = await file.text()
      let htmlContent = text

      // Basic RTF to HTML conversion
      if (file.name.endsWith(".rtf")) {
        // Remove RTF header and footer
        htmlContent = text
          .replace(/^\{\\rtf1[^}]*\}?\s*/i, "")
          .replace(/\}$/g, "")
          // Convert bold
          .replace(/\{\\b\s*([^}]*)\}/g, "<b>$1</b>")
          // Convert italic
          .replace(/\{\\i\s*([^}]*)\}/g, "<i>$1</i>")
          // Convert line breaks
          .replace(/\\par\s*/g, "<br>")
          // Remove other RTF codes
          .replace(/\\[a-z]+\d*\s*/gi, "")
          .replace(/\{|\}/g, "")
          .trim()
      }

      if (editorRef.current) {
        editorRef.current.innerHTML = `<span style="color: #ffffff;">${htmlContent}</span>`
        handleTextChange()
      }
    }
    input.click()
  }

  const handleInput = () => {
    setText(editorRef.current?.innerHTML || "")
    if (shutdownTime > 0) {
      setTimeLeft(shutdownTime)
    }
  }

  const wrapSelectionWithTag = (tagName: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const selectedText = range.toString()
    
    if (!selectedText) return
    
    // Delete the selected content
    range.deleteContents()
    
    // Create wrapper element with the selected text
    const wrapper = document.createElement(tagName)
    wrapper.style.color = "#ffffff"
    wrapper.textContent = selectedText
    
    // Insert the wrapper
    range.insertNode(wrapper)
    
    // Move cursor after the wrapped content
    range.setStartAfter(wrapper)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    
    handleInput()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "b") {
        e.preventDefault()
        wrapSelectionWithTag("b")
      } else if (e.key === "i") {
        e.preventDefault()
        wrapSelectionWithTag("i")
      }
    }
  }

  const applyBold = () => {
    editorRef.current?.focus()
    wrapSelectionWithTag("b")
  }

  const applyItalic = () => {
    editorRef.current?.focus()
    wrapSelectionWithTag("i")
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text/plain")

    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)

      const span = document.createElement("span")
      span.style.color = "#ffffff"
      span.textContent = pastedText

      range.deleteContents()
      range.insertNode(span)

      // Move cursor after inserted content
      range.setStartAfter(span)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    handleInput()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-[#cccccc] font-serif p-4">
      <div className="w-[170px] h-[170px] mb-4 flex items-center justify-center">
        <img src="/images/camus.png" alt="Camus" className="h-[170px] object-contain" />
      </div>

      <h1 className="font-sans text-2xl mb-2">
        <a href="https://soffy.ing" className="text-red-600 underline hover:text-red-500 transition-colors">
          soffy.ing
        </a>
      </h1>

      <nav className="font-sans flex gap-6 mb-4 text-sm">
        <a href="/" className="text-white underline">
          write
        </a>
        <a href="/about" className="text-zinc-400 hover:text-[#B5D1B1] transition-colors">
          about
        </a>
      </nav>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="shutdownTime" className="mr-2">
          Shutdown timer:
        </label>
        <input
          type="text"
          value={customTimer}
          onChange={(e) => {
            if (isTimerLocked) return
            const value = e.target.value
            setCustomTimer(value)
            const numValue = Number.parseInt(value)
            if (!isNaN(numValue) && numValue >= 0) {
              setShutdownTime(numValue)
              setTimeLeft(numValue)
            }
          }}
          placeholder="Custom (s) or 0 for none"
          disabled={isTimerLocked}
          className="w-[180px] bg-black text-white px-3 py-2 border border-zinc-700 focus:outline-none focus:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => setIsTimerLocked(!isTimerLocked)}
          className="text-white underline hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none"
        >
          {isTimerLocked ? "[Locked]" : "Lock timer"}
        </button>
      </div>

      {!isPaused && (
        <div className="w-full max-w-3xl mb-2 flex gap-4">
          <button
            onClick={applyBold}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          >
            [<b>B</b>]
          </button>
          <button
            onClick={applyItalic}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          >
            [<i>I</i>]
          </button>
        </div>
      )}

      {!isPaused && (
        <div className="w-full max-w-3xl flex gap-4 mb-8">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            data-placeholder={placeholderQuote}
            style={{ color: "#ffffff" }}
            className="w-full h-[55vh] bg-black text-base p-4 border border-zinc-700 resize-none focus:outline-none focus:border-zinc-500 overflow-auto empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-500 empty:before:italic"
          />
        </div>
      )}

      <div className="text-center mb-4">
        <div className="text-lg text-zinc-400 mb-2">
          {isRemoving ? (
            <span className="text-red-600">[Removing everything...]</span>
          ) : (
            <span>
              {shutdownTime === 0 ? "[No timer]" : `[${timeLeft}s]`} | [{wordCount} words]
            </span>
          )}
        </div>
        <div className="flex justify-center gap-4 font-sans">
          <button
            onClick={handleImportRTF}
            className="text-zinc-400 hover:text-[#B5D1B1] transition-colors cursor-pointer bg-transparent border-none underline"
          >
            [Import .rtf]
          </button>
          <button
            onClick={handleDownload}
            className="text-zinc-400 hover:text-[#B5D1B1] transition-colors cursor-pointer bg-transparent border-none underline"
          >
            [Download .rtf]
          </button>
          <button
            onClick={handleDownloadPDF}
            className="text-zinc-400 hover:text-[#B5D1B1] transition-colors cursor-pointer bg-transparent border-none underline"
          >
            [Download .pdf]
          </button>
        </div>
      </div>

      {showRestoreButton && (
        <div className="mb-4 text-center">
          <button
            onClick={() => {
              const newClickCount = restoreClicks + 1
              setRestoreClicks(newClickCount)

              if (newClickCount >= 100) {
                if (editorRef.current) {
                  editorRef.current.innerHTML = deletedText
                }
                setText(deletedText)
                setShowRestoreButton(false)
                setRestoreClicks(0)
                setDeletedText("")
              }
            }}
            className="text-yellow-400 underline hover:text-yellow-300 transition-colors cursor-pointer text-sm bg-transparent border-none"
          >
            [Restore deleted text: {restoreClicks}/100]
          </button>
        </div>
      )}
    </div>
  )
}
