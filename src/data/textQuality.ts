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

export function assessText(raw: string): TextAssessment {
  const text = raw.trim()
  const reasons: string[] = []
  let flags = 0

  const lower = text.toLowerCase()
  const letters = lower.replace(/[^a-z]/g, '')
  const words = lower.split(/\s+/).filter(Boolean)
  const tokens = lower.match(/[a-z']+/g) ?? []

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

  // 3) vowel ratio — real prose is ~35–45% vowels
  if (letters.length >= 12) {
    const vowels = (letters.match(/[aeiou]/g) ?? []).length
    const ratio = vowels / letters.length
    if (ratio < 0.18) {
      reasons.push('Almost no vowels — not real words')
      flags += 2
    }
  }

  // 4) excessive repeated character runs (aaaaa, !!!!!)
  if (/(.)\1{4,}/.test(lower)) {
    reasons.push('Excessive repeated characters')
    flags += 1
  }

  // 5) repeated same word (spam / filler)
  if (tokens.length >= 4) {
    const counts: Record<string, number> = {}
    tokens.forEach((t) => (counts[t] = (counts[t] ?? 0) + 1))
    const topRepeat = Math.max(...Object.values(counts))
    if (topRepeat / tokens.length > 0.5) {
      reasons.push('Same word repeated as filler')
      flags += 2
    }
  }

  // 6) low lexical diversity
  if (tokens.length >= 6) {
    const unique = new Set(tokens).size / tokens.length
    if (unique < 0.4) {
      reasons.push('Very low lexical diversity')
      flags += 1
    }
  }

  // 7) mostly non-letters / symbols
  if (text.length >= 10 && letters.length / text.replace(/\s/g, '').length < 0.45) {
    reasons.push('Mostly symbols / numbers')
    flags += 1
  }

  const score = Math.min(1, flags / 4)
  return {
    gibberish: flags >= 2,
    spam: flags >= 1 && flags < 2,
    reasons,
    score,
  }
}
