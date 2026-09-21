const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

export function fmtDate(d: Date | string): string {
  const date = new Date(d)
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export function fmtWords(n: number): string {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? "word" : "words"}`
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`
}
