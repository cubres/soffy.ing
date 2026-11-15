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

// Set phrases that start with a preposition but belong to the rest of the sentence:
// "insisting at the same time", "not believing at all", "depends in part on".
const SET_PHRASE =
  "at all|at the same time|at least|at first|at once|at times|at last|at heart|at most|at best|at worst|at that|in part|in turn|in fact|in general|in particular|in short|in a way|in some way|of course|for example|for instance|for now|for good|for a while|to some extent|to date|with time"

function prepositions(text: string, out: Issue[]) {
  for (const [heads, right, wrongs] of PREPOSITIONS) {
    const re = new RegExp(`\\b(${heads})\\s+(?!(?:${SET_PHRASE})\\b)(${wrongs})\\b`, "gid")
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
  habits(text, out)
  return out
}

// --- the mistakes this writer actually makes ------------------------------------
// Taken from the corrections made to the diary on philo.soffy.ing: lie and lay,
// near-homophones a spellchecker accepts, participles after "had", and a few idioms.

const PARTICIPLE: Record<string, string> = {
  came: "come", ran: "run", began: "begun", drank: "drunk", swam: "swum", sang: "sung", rang: "rung",
  went: "gone", wrote: "written", took: "taken", ate: "eaten", gave: "given", saw: "seen", spoke: "spoken",
  broke: "broken", chose: "chosen", drove: "driven", knew: "known", threw: "thrown", grew: "grown",
  flew: "flown", stole: "stolen", froze: "frozen", fell: "fallen", woke: "woken", did: "done",
  forgot: "forgotten", rode: "ridden", shook: "shaken", hid: "hidden", became: "become", beated: "beaten",
}

// The -ing form of a regular verb: produce → producing, lie → lying, go → going.
function ing(verb: string): string {
  const v = verb.toLowerCase()
  if (v.endsWith("ing")) return v
  if (v.endsWith("ie")) return v.slice(0, -2) + "ying"
  if (v.endsWith("e") && !v.endsWith("ee") && v !== "be") return v.slice(0, -1) + "ing"
  return v + "ing"
}

const ADVERB = "never|already|just|indeed|always|not|finally|also|ever|recently|all|really|truly|since|long|once|only|still|even"

function habits(text: string, out: Issue[]) {
  const push = (start: number, end: number, message: string, replacements: string[]) =>
    out.push({ start, end, kind: "grammar", message, replacements })

  // Lie (to recline): lie, lay, lain, lying. Lay (to put something down): lay, laid, laid, laying.
  // Only when nothing is being put down: "laid down" followed by an object ("laid down the law") is fine.
  const RECLINE =
    "(?:down|back|awake|still|motionless|there|here|around|flat|in bed|on (?:the|my|his|her|their|our|your) (?:ground|floor|bed|grass|sand|couch|sofa|beach|back|side|stomach))"
  const NOT_OBJECT = "(?!\\s+(?:the|a|an|his|her|their|my|our|your|its|some|this|that|these|those|arms|roots|rules|law|plans|foundations?)\\b)"
  each(
    text,
    new RegExp(`\\b(?:(have|has|had|having)\\s+(?:(?:${ADVERB})\\s+)?)?(laying|lays|laid)\\s+(?=${RECLINE}\\b${NOT_OBJECT})`, "giud"),
    (m) => {
      const word = m[2]
      const lower = word.toLowerCase()
      const to = m[1] && lower === "laid" ? "lain" : lower === "laying" ? "lying" : lower === "lays" ? "lies" : "lay"
      const start = groupStart(m, 2)
      return {
        start,
        end: start + word.length,
        kind: "grammar",
        message: `To recline is “to lie” (lie, lay, lain, lying); “to lay” needs an object. Here: “${to}.”`,
        replacements: [matchCase(word, to)],
      }
    },
    out,
  )

  // "had indeed came" → "had indeed come": a participle after have, even with an adverb between.
  each(
    text,
    new RegExp(`\\b(have|has|had|having|'ve)\\s+(?:(?:${ADVERB})\\s+)?(${Object.keys(PARTICIPLE).join("|")})\\b(?!-)`, "giud"),
    (m) => {
      const start = groupStart(m, 2)
      const to = PARTICIPLE[m[2].toLowerCase()]
      return { start, end: start + m[2].length, kind: "grammar", message: `After “${m[1].toLowerCase()},” the participle: “${to}.”`, replacements: [matchCase(m[2], to)] }
    },
    out,
  )

  // Breadth is width; breath is air. "God's breadth", "whose breadth", "catch my breadth".
  each(
    text,
    /\b(?:my|your|his|her|its|our|their|whose|God's|God’s|a|one|last|deep|short|warm|held|hold|holding|catch|caught|out\s+of|under\s+(?:my|his|her|their)|with\s+(?:every|each))\s+(breadth)\b(?!\s+of\b)/giud,
    (m) => {
      const start = groupStart(m, 1)
      push(start, start + m[1].length, "“Breadth” is width; air is “breath.”", [matchCase(m[1], "breath")])
      return null
    },
    out,
  )

  // "passes though" → "passes through": after a verb of motion, it is the preposition.
  each(
    text,
    /\b(?:pass|passes|passed|passing|go|goes|went|going|gone|walk|walks|walked|walking|run|runs|ran|running|look|looks|looked|looking|get|gets|got|getting|come|comes|came|coming|break|broke|broken|cut|cuts|flip|flipped|scroll|scrolled|sift|sifted|move|moves|moved|moving|travel|traveled|travelled|live|lived|living|sleep|slept|see|saw|seen|push|pushed|squeeze|squeezed|shine|shines|shone|flow|flows|flowed|fall|fell|fallen|misery|suffering)\s+(though)\b/giud,
    (m) => {
      const start = groupStart(m, 1)
      push(start, start + 6, "“Though” means “although”; across or by means of is “through.”", [matchCase(m[1], "through")])
      return null
    },
    out,
  )

  // Words a spellchecker accepts that are almost never what was meant in these contexts.
  const nearMisses: [RegExp, string, string][] = [
    [/\b(?:math|maths|mathematics|chess|science|programming|coding|physics|national|international|regional|school|such\s+a)\s+(completion)\b/giud, "competition", "Did you mean “competition”? A completion is a finishing."],
    [/\b(?:constant|sensory|mental|intellectual|over|need\s+for|lack\s+of|craving|crave)\s+(simulation)\b/giud, "stimulation", "Did you mean “stimulation”?"],
    [/\b(?:comforting|the|its|summer|body|burning|unbearable)\s+(hot)\s+(?:for|of|from|was|is|that)\b/giud, "heat", "“Hot” is the adjective; the noun is “heat.”"],
  ]
  for (const [re, to, message] of nearMisses) {
    each(
      text,
      re,
      (m) => {
        const start = groupStart(m, 1)
        push(start, start + m[1].length, message, [matchCase(m[1], to)])
        return null
      },
      out,
    )
  }

  // "how Nature looks like" → "what Nature looks like" (or "how Nature looks").
  each(
    text,
    /\b(how)\s+((?:[\p{L}'’]+\s+){1,4}?)(look|looks|looked|looking|sound|sounds|sounded|seem|seems|seemed|feel|feels|felt)\s+like\b/giud,
    (m) => {
      const start = groupStart(m, 1)
      push(start, start + 3, "Either “what … looks like” or “how … looks”, not both.", [matchCase(m[1], "what")])
      return null
    },
    out,
  )

  const phrase = (re: RegExp, message: string, to: (m: RegExpExecArray) => string, group = 0) =>
    each(
      text,
      re,
      (m) => {
        const start = group ? groupStart(m, group) : m.index
        const len = m[group].length
        push(start, start + len, message, [to(m)])
        return null
      },
      out,
    )

  // "capable to produce" → "capable of producing"
  phrase(
    /\b(?:capable|incapable)\s+(to\s+([\p{L}]+))\b/giud,
    "It is “capable of” followed by the -ing form.",
    (m) => `of ${ing(m[2])}`,
    1,
  )
  phrase(/\b(feel|feels|felt|feeling)\s+shame\s+of\b/giud, "The idiom is “ashamed of.”", (m) => `${m[1]} ashamed of`)
  phrase(/\b(laugh|laughs|laughed|laughing)\s+(?=(?:me|him|her|them|us|you)\b)/giud, "You laugh at someone.", (m) => `${m[1]} at `)
  phrase(
    /\b(?:a|the|rigorous|formal|complete|valid|written|full)\s+proof\s+(to)\s+(?!the\s+contrary)(?=each|every|the|this|that|all|it|them|any)/giud,
    "A proof is “of” (or “for”) a statement.",
    () => "of",
    1,
  )
  phrase(
    /\b(?:necessary|sufficient|absolute|only|first|main|basic|essential|precondition|prerequisite)\s+condition\s+(to)\s+(?=everything|anything|all|any|my|our|its|this|that|the|every)/giud,
    "A condition is “for” something.",
    () => "for",
    1,
  )
  // "if he would have found" → "if he had found"
  phrase(
    /\b[Ii]f\s+(?:I|you|he|she|it|we|they|[\p{Lu}][\p{L}]+|(?:my|his|her|their|our|the)\s+[\p{L}]+)\s+(would\s+have)\s+(?=[\p{L}]+(?:ed|en|wn|ne|ght|t)\b|been|found|made|had|said|told|known|seen|done|gone)/gud,
    "In the “if” part, the past perfect: “had,” not “would have.”",
    () => "had",
    1,
  )
  // "I will too die" → "I too will die"
  phrase(/\b(?:I|we|you|he|she|they|it)\s+(will\s+too)\s+(?=[\p{L}])/giud, "“Too” goes before “will”: “I too will …,” or “I, too, will ….”", () => "too will", 1)
  phrase(/\b(emotionally\s+)?(mature)\s+(?=to\s+(?:have|be|do|know|understand|see|handle|realize|accept)\b)/giud, "Something is missing: “mature enough to.”", (m) => `${m[2]} enough`, 2)
  phrase(/\b(woah)\b/giud, "The standard spelling is “whoa.”", (m) => matchCase(m[1], "whoa"), 1)
  phrase(/\b(?:a\s+)?whole\s+(another)\b/giud, "It is “a whole other.”", () => "other", 1)
  phrase(
    /\b(?:anything|nothing|something|everything|anyone|anybody|someone|somebody|nobody|none|little)\s+(other\s+)(?=(?:a|an|the)\s)/giud,
    "Missing “than”: “other than …”?",
    () => "other than ",
    1,
  )

  // A word typed twice as "It it". Harper finds repeats in the same case; a repeat meant
  // for effect ("makes sympathy sympathy") is never capitalized differently.
  each(
    text,
    /\b([\p{L}]+)\s+(\1)\b/giud,
    (m) => {
      if (m[1] === m[2]) return null
      const start = groupStart(m, 2)
      return { start: m.index + m[1].length, end: start + m[2].length, kind: "grammar", message: `“${m[1]}” twice.`, replacements: [""] }
    },
    out,
  )
}
