// Utility functions for managing quotes and calendar

export interface Quote {
  text: string
  author?: string
}

let cachedQuotes: Quote[] | null = null

export async function fetchQuotes(): Promise<Quote[]> {
  if (cachedQuotes) return cachedQuotes

  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ipo_quotes-ViwVneXrL2dcjx09nnYqdPGwcL68cU.csv",
    )
    const text = await response.text()

    // Parse CSV - assuming format is: quote,author or just quote
    const lines = text.split("\n").filter((line) => line.trim())
    const quotes: Quote[] = []

    for (let i = 1; i < lines.length; i++) {
      // Skip header
      const line = lines[i].trim()
      if (!line) continue

      // Handle CSV with quotes and commas
      const match = line.match(/^"?([^"]*)"?(?:,(.*))?$/)
      if (match) {
        quotes.push({
          text: match[1].replace(/""/g, '"').trim(),
          author: match[2]?.replace(/^"?|"?$/g, "").trim(),
        })
      }
    }

    cachedQuotes = quotes
    return quotes
  } catch (error) {
    console.error("[v0] Failed to fetch quotes:", error)
    // Return empty array if fetch fails
    return []
  }
}

// Get the base date for quote assignment (first Thursday or Sunday)
export function getBaseDate(): Date {
  // Start from January 1, 2024 (a Monday)
  const base = new Date("2024-01-01")
  // Find the first Thursday (day 4)
  while (base.getDay() !== 4) {
    base.setDate(base.getDate() + 1)
  }
  return base
}

// Check if a date is a writing day (Thursday or Sunday)
export function isWritingDay(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 4 // Sunday or Thursday
}

// Get the quote index for a specific date
export function getQuoteIndexForDate(date: Date, totalQuotes: number): number {
  if (totalQuotes === 0) return -1

  const baseDate = getBaseDate()
  const currentDate = new Date(date)
  currentDate.setHours(0, 0, 0, 0)

  // Count writing days from base date to current date
  let writingDayCount = 0
  const tempDate = new Date(baseDate)

  while (tempDate <= currentDate) {
    if (isWritingDay(tempDate)) {
      if (tempDate.getTime() === currentDate.getTime()) {
        return writingDayCount % totalQuotes
      }
      writingDayCount++
    }
    tempDate.setDate(tempDate.getDate() + 1)
  }

  return -1
}

// Get the next writing day from today
export function getNextWritingDay(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next = new Date(today)
  next.setDate(next.getDate() + 1)

  while (!isWritingDay(next)) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

// Get days until next writing day
export function getDaysUntilNextWriting(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next = getNextWritingDay()

  const diffTime = next.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

// Format the "See quote for..." text
export function getNextQuoteText(): string {
  const days = getDaysUntilNextWriting()

  if (days === 0) return "See today's quote"
  if (days === 1) return "See quote for tomorrow"
  return `See quote in ${days} days`
}
