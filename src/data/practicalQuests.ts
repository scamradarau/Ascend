import type { Trait, MainQuest, AttributeId } from './types'

// ================================================================
// PRACTICAL MAIN-QUEST VARIANTS
// Every trait's headline main quest is a book. Plenty of disciplined
// people don't read — so each trait also offers a non-book variant:
// a 2-week practical challenge proven with photos / check-ins, worth
// the same EXP as the book path. The player picks which path to run.
//
// Server catalog id for the practical variant is `main-practical:<traitId>`
// (the book path stays `main:<traitId>`). Same base_exp on both.
// ================================================================

export const PRACTICAL_QUEST_PREFIX = 'main-practical:'

// per-attribute framing for the 2-week challenge
const TEMPLATES: Record<
  AttributeId,
  (t: Trait) => Pick<MainQuest, 'title' | 'why' | 'checkIn'>
> = {
  body: (t) => ({
    title: `14-Day ${t.name} Challenge`,
    checkIn: 'photo',
    why: `Skip the reading — train it instead. For two weeks, do one ${t.name.toLowerCase()} session and snap a photo as proof. Showing up beats reading about showing up.`,
  }),
  mind: (t) => ({
    title: `14-Day ${t.name} Sprint`,
    checkIn: 'photo',
    why: `A practical, no-book path: for two weeks put ${t.name.toLowerCase()} to work on something real and photograph the result. Reps over theory.`,
  }),
  will: (t) => ({
    title: `14-Day ${t.name} Streak`,
    checkIn: 'photo',
    why: `Forget the book — live it. For two weeks hold your keystone ${t.name.toLowerCase()} habit and capture proof each check-in. Discipline is built, not read.`,
  }),
  heart: (t) => ({
    title: `14-Day ${t.name} Challenge`,
    checkIn: 'reflection',
    why: `Instead of reading, do the work: for two weeks take one real action that stretches your ${t.name.toLowerCase()} and log honest proof. Growth lives outside the comfort zone.`,
  }),
  charisma: (t) => ({
    title: `14-Day ${t.name} Challenge`,
    checkIn: 'reflection',
    why: `No book needed — practise it. For two weeks initiate one real interaction that builds your ${t.name.toLowerCase()} and log what happened. Skills come from reps, not pages.`,
  }),
}

/** Build the practical (non-book) main quest for a trait. */
export function practicalQuestFor(t: Trait): MainQuest {
  const tpl = TEMPLATES[t.attribute](t)
  return { ...tpl, exp: t.mainQuest.exp }
}

/** The server quest id for a trait's practical variant. */
export function practicalQuestId(traitId: string): string {
  return `${PRACTICAL_QUEST_PREFIX}${traitId}`
}
