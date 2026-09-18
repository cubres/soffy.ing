const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

export function fmtDate(d: Date | string): string {
  const date = new Date(d)
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export function fmtMinutes(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 1) return "under a minute"
  if (m === 1) return "a minute"
  return `${m} minutes`
}

export function fmtClock(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) return seconds === 60 ? "one-minute" : `${seconds / 60}-minute`
  return `${seconds}-second`
}

export function fmtWords(n: number): string {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? "word" : "words"}`
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`
}
