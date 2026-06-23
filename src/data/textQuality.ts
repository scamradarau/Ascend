// ================================================================
// Gibberish / spam detection for written check-ins.
// Heuristic, on-device first line of defence (server-side AI is the
// second). Catches keyboard-mashing, repeated filler and low-effort
// spam before it earns EXP.
// ================================================================

export interface TextAssessment {
  gibberish: boolean
  spam: boolean
  reasons: string[]
  score: number // 0 (great) .. 1 (clearly junk)
}

const KEYBOARD_RUNS = [
  'qwerty', 'asdf', 'asdfgh', 'zxcv', 'jkl', 'hjkl', 'qwer', 'wasd', 'uiop', 'sdfg', 'fghj',
]

// Words that show up in almost any genuine English sentence. A real
// reflection of any length contains several of these; keyboard-mashing
// contains none. (Matched against apostrophe-stripped tokens.)
const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'so', 'if', 'then', 'than', 'as', 'of', 'to', 'in', 'on',
  'at', 'by', 'for', 'with', 'from', 'into', 'about', 'over', 'out', 'up', 'down', 'off',
  'i', 'im', 'ive', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'you', 'your', 'he', 'she',
  'they', 'them', 'it', 'this', 'that', 'these', 'those',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'did', 'done', 'does', 'have',
  'has', 'had', 'will', 'would', 'can', 'could', 'should', 'shall', 'may', 'might', 'must', 'not',
  'no', 'yes',
  'today', 'tomorrow', 'yesterday', 'day', 'time', 'now', 'more', 'less', 'just', 'really', 'very',
  'feel', 'felt', 'feeling', 'want', 'wanted', 'need', 'needed', 'go', 'going', 'got', 'get', 'make',
  'made', 'work', 'working', 'worked', 'because', 'when', 'what', 'who', 'how', 'why', 'all', 'some',
  'good', 'bad', 'better', 'best', 'like', 'know', 'think', 'thought', 'much', 'many', 'and',
])

const VOWELS = /[aeiouy]/

export function assessText(raw: string): TextAssessment {
  const text = raw.trim()
  const reasons: string[] = []
  let flags = 0

  const lower = text.toLowerCase()
  const letters = lower.replace(/[^a-z]/g, '')
  const words = lower.split(/\s+/).filter(Boolean)
  const tokens = lower.match(/[a-z']+/g) ?? []
  const cleanTokens = tokens.map((t) => t.replace(/'/g, ''))

  // 1) keyboard mashing
  if (KEYBOARD_RUNS.some((k) => lower.includes(k))) {
    reasons.push('Keyboard-mash pattern detected')
    flags += 2
  }

  // 2) long token with no spaces (e.g. "kjsdfhksjdfhksjdf")
  const longest = words.reduce((m, w) => Math.max(m, w.length), 0)
  if (longest >= 22 && words.length <= 3) {
    reasons.push('Single very long unbroken token')
    flags += 2
  }

  // 3) vowel ratio - real prose is ~35–45% vowels; anything this low is junk
  if (letters.length >= 12) {
    const vowels = (letters.match(/[aeiou]/g) ?? []).length
    const ratio = vowels / letters.length
    if (ratio < 0.24) {
      reasons.push('Far too few vowels - not real words')
      flags += 2
    } else if (ratio < 0.3) {
      reasons.push('Unusually few vowels')
      flags += 1
    }
  }

  // 4) excessive repeated character runs (aaaaa, !!!!!)
  if (/(.)\1{4,}/.test(lower)) {
    reasons.push('Excessive repeated characters')
    flags += 1
  }

  // 5) repeated same word (spam / filler)
  if (cleanTokens.length >= 4) {
    const counts: Record<string, number> = {}
    cleanTokens.forEach((t) => (counts[t] = (counts[t] ?? 0) + 1))
    const topRepeat = Math.max(...Object.values(counts))
    if (topRepeat / cleanTokens.length > 0.5) {
      reasons.push('Same word repeated as filler')
      flags += 2
    }
  }

  // 6) low lexical diversity
  if (cleanTokens.length >= 5) {
    const unique = new Set(cleanTokens).size / cleanTokens.length
    if (unique < 0.5) {
      reasons.push('Very low lexical diversity')
      flags += 1
    }
  }

  // 7) mostly non-letters / symbols
  if (text.length >= 10 && letters.length / text.replace(/\s/g, '').length < 0.45) {
    reasons.push('Mostly symbols / numbers')
    flags += 1
  }

  // 8) tiny alphabet - home-row mashing like "asd asd asd", "jkl jkl" uses
  //    only a handful of distinct letters. Real writing uses many.
  if (letters.length >= 12) {
    const distinctLetters = new Set(letters.split('')).size
    if (distinctLetters <= 5) {
      reasons.push('Only a few distinct letters - keyboard mashing')
      flags += 3
    } else if (distinctLetters <= 8) {
      reasons.push('Unusually few distinct letters')
      flags += 1
    }
  }

  // 9) lots of very short tokens (mostly 1–3 char "words")
  if (cleanTokens.length >= 6) {
    const shortRatio = cleanTokens.filter((t) => t.length <= 3).length / cleanTokens.length
    if (shortRatio > 0.7) {
      reasons.push('Mostly tiny non-words')
      flags += 1
    }
  }

  // 10) vowel-less tokens - real words almost always contain a vowel (incl. y).
  //     Tokens like "rhf", "gdrt", "txh", "rghdftw" are unambiguous junk. This
  //     is the strongest single signal for scattered keyboard-mashing.
  const vowellessJunk = cleanTokens.filter((t) => t.length >= 3 && !VOWELS.test(t))
  if (vowellessJunk.length >= 2) {
    reasons.push('Contains made-up words with no vowels')
    flags += 3
  } else if (vowellessJunk.length === 1 && cleanTokens.length <= 8) {
    reasons.push('Contains a vowel-less non-word')
    flags += 1
  }

  // 11) no real words - a genuine reflection of any length contains common
  //     English function words ("I", "the", "to", "and"…). Zero of them across
  //     many tokens means it isn't real writing.
  if (cleanTokens.length >= 8) {
    const realWords = cleanTokens.filter((t) => FUNCTION_WORDS.has(t)).length
    if (realWords === 0) {
      reasons.push('No recognisable English words')
      flags += 3
    }
  }

  const score = Math.min(1, flags / 4)
  return {
    gibberish: flags >= 2,
    spam: flags >= 1 && flags < 2,
    reasons,
    score,
  }
}
