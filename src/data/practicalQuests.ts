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

// per-attribute framing for the 2-week challenge. Each defines a
// `commitmentPrompt` — the player locks in their specific commitment, then
// photographs it across the challenge as proof.
const TEMPLATES: Record<
  AttributeId,
  (t: Trait) => Pick<MainQuest, 'title' | 'why' | 'checkIn' | 'commitmentPrompt'>
> = {
  body: (t) => ({
    title: `14-Day ${t.name} Challenge`,
    checkIn: 'photo',
    commitmentPrompt: 'Define your training commitment (e.g. “Push workout”, “5 km run”, “100 push-ups”)',
    why: `Skip the reading — train it instead. Lock in your commitment, then photograph it across the next two weeks. Showing up beats reading about showing up.`,
  }),
  mind: (t) => ({
    title: `14-Day ${t.name} Sprint`,
    checkIn: 'photo',
    commitmentPrompt: 'Define your daily practice (e.g. “30 min deep work on my project”, “20 Anki cards”)',
    why: `A practical, no-book path: lock in what you’ll practise, then photograph the work across two weeks. Reps over theory.`,
  }),
  will: (t) => ({
    title: `14-Day ${t.name} Streak`,
    checkIn: 'photo',
    commitmentPrompt: 'Define your keystone habit (e.g. “5 AM wake-up”, “cold shower”, “no phone till noon”)',
    why: `Forget the book — live it. Lock in your keystone habit, then capture photo proof each check-in. Discipline is built, not read.`,
  }),
  heart: (t) => ({
    title: `14-Day ${t.name} Challenge`,
    checkIn: 'photo',
    commitmentPrompt: 'Define your daily action (e.g. “one thing that scares me”, “10-min cold exposure”)',
    why: `Instead of reading, do the work: lock in a daily action that stretches you, then photograph the proof over two weeks. Growth lives outside the comfort zone.`,
  }),
  charisma: (t) => ({
    title: `14-Day ${t.name} Challenge`,
    checkIn: 'photo',
    commitmentPrompt: 'Define your daily rep (e.g. “start one real conversation”, “speak up in a meeting”)',
    why: `No book needed — practise it. Lock in your daily rep, then capture proof across two weeks. Skills come from reps, not pages.`,
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
