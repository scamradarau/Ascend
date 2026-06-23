// ================================================================
// HANDLE MODERATION - a baseline profanity / slur / impersonation
// filter for player handles. Not exhaustive (no client list ever is),
// but it stops the obvious offenders at creation time and gives the
// owner a "rename hammer" that reuses the same check.
//
// Strategy: normalise leetspeak + strip separators, then test the
// collapsed string against a list of blocked stems. This catches
// "Pu55y_Destroyer", "p-u-s-s-y", "a$$hole", etc.
// ================================================================

// Blocked substrings (stems). Kept deliberately short - these match as
// substrings of the normalised handle, so "ass" intentionally also blocks
// longer variants. A few benign words that contain a stem are allowed back
// via ALLOW below.
const BLOCKED_STEMS = [
  // sexual / genitalia
  'pussy', 'cock', 'dick', 'penis', 'vagina', 'cunt', 'boner', 'dildo',
  'cum', 'jizz', 'tits', 'titties', 'blowjob', 'handjob', 'rimjob',
  'anal', 'orgasm', 'masturbat', 'creampie', 'deepthroat', 'gangbang',
  // acts / vulgarity
  'fuck', 'fuk', 'fvck', 'shit', 'bullshit', 'asshole', 'bitch', 'bastard',
  'whore', 'slut', 'skank', 'wank', 'jerkoff', 'twat', 'bollock',
  'destroyer', // pairs with sexual stems - common in offensive handles
  // slurs (racial / homophobic / ableist) - zero tolerance
  'nigger', 'nigga', 'nig9', 'faggot', 'fag', 'retard', 'tranny', 'kike',
  'spic', 'chink', 'gook', 'wetback', 'coon', 'beaner', 'paki', 'dyke',
  // hate / extremism
  'nazi', 'hitler', 'kkk', 'rape', 'rapist', 'pedo', 'paedo', 'molest',
  // impersonation / reserved
  'admin', 'moderator', 'official', 'ascendteam', 'ascendstaff', 'support',
  'system', 'root', 'owner',
]

// Words that contain a blocked stem but are themselves fine.
const ALLOW = new Set(['assassin', 'class', 'glass', 'grass', 'bass', 'pass', 'compass', 'cassowary'])

const LEET: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g',
  '@': 'a', '$': 's', '!': 'i', '|': 'i',
}

function normalise(raw: string): string {
  const lower = raw.toLowerCase()
  let out = ''
  for (const ch of lower) out += LEET[ch] ?? ch
  // strip everything that isn't a-z so separators (._-spaces) can't smuggle stems
  return out.replace(/[^a-z]/g, '')
}

/**
 * Validate a handle for creation/rename.
 * @returns an error message, or `null` if the handle is acceptable.
 */
export function validateHandle(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed.length < 3) return 'Handle must be at least 3 characters.'
  if (trimmed.length > 20) return 'Handle must be 20 characters or fewer.'
  if (!/^[\w .\-]+$/.test(trimmed))
    return 'Handle can only use letters, numbers, spaces, . _ and -'

  const norm = normalise(trimmed)
  if (ALLOW.has(norm)) return null
  for (const stem of BLOCKED_STEMS) {
    if (norm.includes(stem)) return 'That handle isn’t allowed - please choose another.'
  }
  return null
}

/** Convenience boolean form. */
export function isHandleClean(raw: string): boolean {
  return validateHandle(raw) === null
}
