import type { Issue } from "./types"

// Rules Harper does not have: the prepositions a word demands, verbs after modals,
// pronoun case, agreement with "everyone", and a few word mix-ups. Every rule is
// written to stay quiet when unsure, because a checker that cries wolf gets ignored.

const DETERMINERS = new Set(
  "a an the this that these those my your his her its our their no any some free good ill political own sheer".split(" "),
)

function matchCase(original: string, replacement: string): string {
  if (original[0] && original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1)
  }
  return replacement
}

// "a|b" → "[Aa]|[Bb]": case-insensitive words in a regex that must stay case-sensitive elsewhere.
function anyCase(words: string): string {
  return words
    .split("|")
    .map((w) => `[${w[0].toUpperCase()}${w[0]}]${w.slice(1)}`)
    .join("|")
}

function prevWord(text: string, index: number): string {
  const m = text.slice(Math.max(0, index - 40), index).match(/([\p{L}']+)\s*$/u)
  return m ? m[1].toLowerCase() : ""
}

// Every match of `re` (global, case-insensitive) becomes zero or more issues.
function each(text: string, re: RegExp, fn: (m: RegExpExecArray) => Issue | null, out: Issue[]) {
  re.lastIndex = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const issue = fn(m)
    if (issue) out.push(issue)
  }
}

// Start of the n-th capture group inside the match.
function groupStart(m: RegExpExecArray, n: number): number {
  return m.indices![n][0]
}

// --- prepositions -----------------------------------------------------------

// [word forms, the preposition English wants, prepositions that are wrong after it]
const PREPOSITIONS: [string, string, string][] = [
  ["depend|depends|depended|depending|dependent|dependence|dependency", "on", "at|of|from|with"],
  ["rely|relies|relied|relying|reliant|reliance", "on", "at|of|from|with|to"],
  ["consist|consists|consisted|consisting", "of", "from|with|by"],
  ["responsible", "for", "of|about"],
  ["capable|incapable", "of", "to"],
  ["afraid", "of", "from"],
  ["proud", "of", "on|from|with"],
  ["similar|dissimilar", "to", "with|than"],
  ["aware|unaware", "of", "about|on|from"],
  ["famous|renowned", "for", "of"],
  ["insist|insists|insisted|insisting", "on", "in|at|about|for"],
  ["participate|participates|participated|participating", "in", "at|to"],
  ["focus|focuses|focused|focusing|focussed|focussing", "on", "at"],
  ["concentrate|concentrates|concentrated|concentrating", "on", "at"],
  ["angry|furious", "at", "on"],
  ["congratulate|congratulates|congratulated|congratulating", "on", "for"],
  ["based", "on", "of|from"],
  ["addicted", "to", "of|on|with"],
  ["comply|complies|complied|complying", "with", "to"],
  ["consistent|inconsistent", "with", "to|of"],
  ["different", "from", "of"],
  ["married", "to", "at"],
  ["fond", "of", "with|to"],
  ["suffer|suffers|suffered|suffering", "from", "of|with"],
  ["succeed|succeeds|succeeded|succeeding", "in", "on|to"],
  ["believe|believes|believed|believing", "in", "on|at"],
]

function prepositions(text: string, out: Issue[]) {
  for (const [heads, right, wrongs] of PREPOSITIONS) {
    const re = new RegExp(`\\b(${heads})\\s+(${wrongs})\\b`, "gid")
    each(
      text,
      re,
      (m) => {
        const start = groupStart(m, 2)
        return {
          start,
          end: start + m[2].length,
          kind: "grammar",
          message: `It is “${m[1].toLowerCase()} ${right},” not “${m[1].toLowerCase()} ${m[2].toLowerCase()}.”`,
          replacements: [matchCase(m[2], right)],
        }
      },
      out,
    )
  }
}

// --- verbs that take their object through a preposition -----------------------

function missingPreposition(text: string, out: Issue[]) {
  const rules: [RegExp, string, string][] = [
    [/\b(explain|explains|explained|explaining)\s+(me|us|him)\b/gid, "to", "You explain something to someone."],
    [
      /\b(listen|listens|listened|listening)\s+(music|me|him|her|them|us|it|this|that|the|a|my|your|his|our|their)\b/gid,
      "to",
      "You listen to something.",
    ],
    [/\b(wait|waits|waited|waiting)\s+(me|him|her|them|us)\b/gid, "for", "You wait for someone."],
  ]
  for (const [re, prep, message] of rules) {
    each(
      text,
      re,
      (m) => ({
        start: m.index,
        end: m.index + m[1].length,
        kind: "grammar",
        message,
        replacements: [`${m[1]} ${prep}`],
      }),
      out,
    )
  }

  // Words that already contain their preposition.
  const redundant: [RegExp, string][] = [
    [/\b(emphasize|emphasizes|emphasized|emphasizing|emphasise|emphasises|emphasised|emphasising)\s+on\b/gid, "“Emphasize” takes its object directly."],
    [/\b(mention|mentions|mentioned|mentioning)\s+about\b/gid, "“Mention” takes its object directly."],
    [/\b(return|returns|returned|returning)\s+back\b/gid, "“Return” already means going back."],
  ]
  for (const [re, message] of redundant) {
    each(
      text,
      re,
      (m) => ({ start: m.index, end: m.index + m[0].length, kind: "grammar", message, replacements: [m[1]] }),
      out,
    )
  }
}

// --- verbs after modals -------------------------------------------------------

const MODALS = "can|could|should|would|will|must|might|may|shall|cannot|can't|couldn't|shouldn't|wouldn't|won't|mustn't"

// Inflected forms people put after a modal or "doesn't", with the base form that belongs there.
const BASE: Record<string, string> = {
  goes: "go", does: "do", has: "have", knows: "know", wants: "want", likes: "like", needs: "need",
  makes: "make", says: "say", thinks: "think", works: "work", seems: "seem", takes: "take", gets: "get",
  comes: "come", looks: "look", feels: "feel", gives: "give", tells: "tell", means: "mean", writes: "write",
  reads: "read", sees: "see", tries: "try", lives: "live", loves: "love",
  went: "go", came: "come", saw: "see", took: "take", gave: "give", wrote: "write", ate: "eat", ran: "run",
  made: "make", knew: "know", thought: "think", said: "say", got: "get", felt: "feel", told: "tell",
  began: "begin", spoke: "speak", broke: "break", chose: "choose", drove: "drive", found: "find",
  brought: "bring", bought: "buy", wanted: "want", liked: "like", needed: "need", tried: "try",
}

function modals(text: string, out: Issue[]) {
  // "must to go" → "must go"
  each(
    text,
    new RegExp(`\\b(${MODALS})\\s+to\\s+[\\p{L}]`, "giud"),
    (m) => {
      if (DETERMINERS.has(prevWord(text, m.index))) return null // "the will to live", "a must to see"
      if (/^(Will|May)$/.test(m[1])) return null // names
      return {
        start: m.index,
        end: m.index + m[0].length - 1,
        kind: "grammar",
        message: `No “to” after “${m[1].toLowerCase()}.”`,
        replacements: [m[1] + " "],
      }
    },
    out,
  )

  // "can goes", "should went", "doesn't knows" → the base form
  each(
    text,
    new RegExp(`\\b(${MODALS}|doesn't|don't|didn't|does not|do not|did not)(\\s+not)?\\s+([\\p{L}]+)\\b(?!-)`, "giud"),
    (m) => {
      const word = m[3]
      const base = BASE[word.toLowerCase()]
      if (!base) return null
      if (DETERMINERS.has(prevWord(text, m.index))) return null
      if (/^(Will|May)$/.test(m[1])) return null // "Will went home" is about Will
      const start = groupStart(m, 3)
      return {
        start,
        end: start + word.length,
        kind: "grammar",
        message: `After “${m[1].toLowerCase()},” use the base form: “${base}.”`,
        replacements: [matchCase(word, base)],
      }
    },
    out,
  )

  // "look forward to hear" → "look forward to hearing"
  const ING: Record<string, string> = {
    hear: "hearing", see: "seeing", meet: "meeting", work: "working", receive: "receiving", get: "getting",
    speak: "speaking", talk: "talking", go: "going", read: "reading", write: "writing", have: "having",
    be: "being", visit: "visiting", join: "joining", start: "starting", welcome: "welcoming", help: "helping",
  }
  each(
    text,
    /\b(look|looks|looked|looking)\s+forward\s+to\s+([\p{L}]+)\b/giud,
    (m) => {
      const ing = ING[m[2].toLowerCase()]
      if (!ing) return null
      const start = groupStart(m, 2)
      return {
        start,
        end: start + m[2].length,
        kind: "grammar",
        message: "“Look forward to” is followed by the -ing form.",
        replacements: [ing],
      }
    },
    out,
  )
}

// --- pronouns -----------------------------------------------------------------

function pronouns(text: string, out: Issue[]) {
  // "between you and I." → "me": only where "I" ends the phrase, so "to you and I will" stays alone.
  each(
    text,
    new RegExp(
      `\\b(${anyCase("between|for|with|to|from|like|about|against|among|without|behind|beside|toward|towards|of|at|by")})\\s+((?:you|him|her|them|us|my\\s+[\\p{L}]+|[\\p{Lu}][\\p{L}]+)\\s+and)\\s+(I)(?=\\s*(?:[.,;:!?)]|$))`,
      "gud",
    ),
    (m) => {
      const start = groupStart(m, 3)
      return { start, end: start + 1, kind: "grammar", message: `After “${m[1]},” it is “me,” not “I.”`, replacements: ["me"] }
    },
    out,
  )

  // "Me and him went" → "He and I went"
  const SUBJECT: Record<string, string> = { him: "he", her: "she", them: "they", you: "you", us: "we" }
  each(
    text,
    /(?:^|[.!?]\s+|\n\s*)(Me and (him|her|them|you|my\s+[\p{L}]+|[\p{Lu}][\p{L}]+))\s+(went|are|were|have|had|did|will|would|can|could|got|go|like|love|want|think|was|is|saw|came|made|used|never|always|both)\b/gud,
    (m) => {
      const start = groupStart(m, 1)
      const other = SUBJECT[m[2].toLowerCase()] ?? m[2]
      return {
        start,
        end: start + m[1].length,
        kind: "grammar",
        message: "As the subject of a sentence it is “I,” not “me,” and it goes last.",
        replacements: [`${other[0].toUpperCase()}${other.slice(1)} and I`],
      }
    },
    out,
  )

  // "everyone have" → "everyone has"
  const SINGULAR: Record<string, string> = { have: "has", are: "is", were: "was", "don't": "doesn't", do: "does" }
  const SKIP_AFTER = new Set(
    "does did do will would can could should may might must shall let make makes made help helps helped have had that if wish lest".split(" "),
  )
  each(
    text,
    /\b(everyone|everybody|someone|somebody|anyone|anybody|no one|nobody|everything|nothing|something|anything)\s+(have|are|were|don't|do)\b/giud,
    (m) => {
      if (SKIP_AFTER.has(prevWord(text, m.index))) return null
      const start = groupStart(m, 2)
      return {
        start,
        end: start + m[2].length,
        kind: "grammar",
        message: `“${m[1].toLowerCase()}” is singular: “${SINGULAR[m[2].toLowerCase()]}.”`,
        replacements: [SINGULAR[m[2].toLowerCase()]],
      }
    },
    out,
  )
}

// --- word mix-ups -------------------------------------------------------------

function mixups(text: string, out: Issue[]) {
  const swap = (re: RegExp, group: number, to: string, message: string) =>
    each(
      text,
      re,
      (m) => {
        const start = groupStart(m, group)
        return { start, end: start + m[group].length, kind: "grammar", message, replacements: [matchCase(m[group], to)] }
      },
      out,
    )

  swap(
    /\b(?:more|less|better|worse|rather|other|bigger|smaller|faster|slower|greater|higher|lower|longer|shorter|older|younger|larger|easier|harder|fewer|further|farther)\s+(then)\b/giud,
    1,
    "than",
    "Comparisons take “than”; “then” is about time.",
  )
  // A possessive needs a noun after it, so "their" before punctuation is "there".
  swap(/\b(their)(?=\s*[.,;:!?]|\s*$)/giud, 1, "there", "“Their” owns something; the place is “there.”")
  swap(/\b(your)(?=\s+(?:welcome|right|wrong)\s*[.,;:!?]|\s+not\b|\s+going\s+to\b)/giud, 1, "you're", "“You're” is “you are”; “your” owns something.")

  const phrases: [RegExp, string, string][] = [
    [/\bin the other hand\b/giud, "on the other hand", "The idiom is “on the other hand.”"],
    [/\b(?:in|with) regards to\b/giud, "", "The phrase is “in regard to” or “with regard to.”"],
    [/\birregardless\b/giud, "regardless", "“Regardless” already means this."],
    [/\beach and everyone\b/giud, "each and every one", "It is “each and every one.”"],
    [/\bin accordance to\b/giud, "in accordance with", "It is “in accordance with.”"],
  ]
  for (const [re, to, message] of phrases) {
    each(
      text,
      re,
      (m) => {
        const replacement = to || m[0].replace(/regards/i, "regard")
        return { start: m.index, end: m.index + m[0].length, kind: "grammar", message, replacements: [matchCase(m[0], replacement)] }
      },
      out,
    )
  }
}

export function extraRules(text: string): Issue[] {
  const out: Issue[] = []
  prepositions(text, out)
  missingPreposition(text, out)
  modals(text, out)
  pronouns(text, out)
  mixups(text, out)
  return out
}
