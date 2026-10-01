// The language a piece of text is written in, guessed from its letters: mostly
// Cyrillic is Bulgarian, anything else is English. Browsers pick the spellcheck
// dictionary from `lang`, so the textarea has to say what it actually holds.
export function textLang(text: string): "bg" | "en" {
  const cyrillic = text.match(/\p{Script=Cyrillic}/gu)?.length ?? 0
  const latin = text.match(/\p{Script=Latin}/gu)?.length ?? 0
  return cyrillic > latin ? "bg" : "en"
}
