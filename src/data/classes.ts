// ================================================================
// CLASSES — a rank-progression of masked hero portraits. Your class
// is derived from your level: you evolve up the ladder from Seer to
// the apex Samurai Warlord as you climb. Each portrait is a painted/3D
// PNG dropped in public/classes/<id>.png (transparent, square,
// composed for a circular crop). If a file is missing, the avatar
// gracefully falls back to the procedural SVG bust.
// ================================================================

export interface GameClass {
  id: string
  name: string
  blurb: string
  color: string
  minLevel: number
  img: string
}

export const CLASSES: GameClass[] = [
  {
    id: 'seer',
    name: 'Seer',
    minLevel: 1,
    color: '#22d3ee',
    blurb: 'The hooded mystic. Every ascent begins in shadow and starlight.',
    img: '/classes/seer.webp',
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    minLevel: 15,
    color: '#7cfc00',
    blurb: 'The disciplined knight. The line holds because you hold it.',
    img: '/classes/vanguard.webp',
  },
  {
    id: 'warden',
    name: 'Warden',
    minLevel: 30,
    color: '#ec4899',
    blurb: 'The winged guardian. Resilient, radiant, unbroken.',
    img: '/classes/warden.webp',
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    minLevel: 45,
    color: '#a855f7',
    blurb: 'The crowned enchanter. Presence that commands the room.',
    img: '/classes/sovereign.webp',
  },
  {
    id: 'titan',
    name: 'Titan',
    minLevel: 60,
    color: '#fbbf24',
    blurb: 'The horned champion. Raw power forged under relentless load.',
    img: '/classes/titan.webp',
  },
  {
    id: 'samurai',
    name: 'Warlord',
    minLevel: 80,
    color: '#dc2626',
    blurb: 'The apex. Few reach the oni mask. Fear and mastery, made one.',
    img: '/classes/samurai.webp',
  },
]

// Highest class whose level requirement the player has met.
export function classForLevel(level: number): GameClass {
  let cls = CLASSES[0]
  for (const c of CLASSES) if (level >= c.minLevel) cls = c
  return cls
}

export const classById = (id: string): GameClass | undefined =>
  CLASSES.find((c) => c.id === id)

// A class is unlocked once you reach its level (owner unlocks everything).
export function isClassUnlocked(cls: GameClass, level: number, owner = false): boolean {
  return owner || level >= cls.minLevel
}

// The class to actually display: the chosen one if it's unlocked, otherwise
// the highest class your level grants.
export function resolveClass(level: number, classId?: string | null, owner = false): GameClass {
  if (classId) {
    const chosen = classById(classId)
    if (chosen && isClassUnlocked(chosen, level, owner)) return chosen
  }
  return classForLevel(level)
}

// The next class up the ladder (for "next unlock" hints), or undefined at apex.
export function nextClass(level: number): GameClass | undefined {
  const current = classForLevel(level)
  const idx = CLASSES.indexOf(current)
  return CLASSES[idx + 1]
}
