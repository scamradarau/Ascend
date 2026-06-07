// ================================================================
// THE STOIC — a counsel speaking with the combined voice of
// Marcus Aurelius, Seneca, and Epictetus.
//
// This is a self-contained advisor (no external API/key, fully
// private): it matches a question to Stoic themes and composes a
// reply from real, attributed quotes + practical guidance. It only
// answers self-improvement / life questions; anything else is gently
// declined in character. (Upgradeable to a live LLM via the backend,
// where the key stays server-side — see BACKEND_PLAN.md.)
// ================================================================

export type Speaker = 'Marcus Aurelius' | 'Seneca' | 'Epictetus'

interface Quote {
  text: string
  who: Speaker
}

interface Theme {
  id: string
  keywords: string[]
  reflection: string
  quotes: Quote[]
  practice: string
}

const THEMES: Theme[] = [
  {
    id: 'discipline',
    keywords: ['discipline', 'lazy', 'lazi', 'willpower', 'self-control', 'self control', 'consistent', 'consistency', 'motivat', 'procrastinat', 'distract', 'focus', 'habit'],
    reflection:
      'Discipline is not punishment — it is the freedom to become who you intend to be. The undisciplined are ruled by every passing mood; the disciplined rule themselves.',
    quotes: [
      { text: 'No man is free who is not master of himself.', who: 'Epictetus' },
      { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', who: 'Marcus Aurelius' },
      { text: 'Most powerful is he who has himself in his own power.', who: 'Seneca' },
    ],
    practice:
      'Choose one small action you will perform today regardless of how you feel. Do it before you negotiate with yourself. Repeat tomorrow. Mastery is built rep by rep.',
  },
  {
    id: 'procrastination',
    keywords: ['procrastinat', 'put off', 'putting off', 'keep delaying', 'do it later', 'waste time', 'wasting time', 'time management', 'lazy to start'],
    reflection:
      'You do not lack time — you spend it as though it were limitless. Treat each day as a whole life in miniature, and the postponing mind loses its grip.',
    quotes: [
      { text: 'It is not that we have a short time to live, but that we waste a lot of it.', who: 'Seneca' },
      { text: 'You could leave life right now. Let that determine what you do and say and think.', who: 'Marcus Aurelius' },
      { text: 'No longer talk about the kind of man a good man ought to be — be such.', who: 'Epictetus' },
    ],
    practice:
      'Name the single most important task. Do it first, before email, before noise — “eat the frog.” Begin badly if you must; momentum forgives a clumsy start.',
  },
  {
    id: 'fear',
    keywords: ['fear', 'afraid', 'anxious', 'anxiety', 'worry', 'worried', 'nervous', 'scared', 'overwhelm', 'panic', 'stress'],
    reflection:
      'Most of your suffering is rehearsal — disasters your imagination stages that never arrive. Meet the fear plainly and it shrinks to its true, smaller size.',
    quotes: [
      { text: 'We suffer more often in imagination than in reality.', who: 'Seneca' },
      { text: 'Today I escaped from anxiety. Or no — I discarded it, because it was within me.', who: 'Marcus Aurelius' },
    ],
    practice:
      'Write the worst case in plain words, then ask: could I endure it, and could I recover? Almost always, yes. Then act on the part you control and release the rest.',
  },
  {
    id: 'anger',
    keywords: ['anger', 'angry', 'frustrat', 'rage', 'irritat', 'annoy', 'resent', 'temper', 'mad'],
    reflection:
      'Anger promises strength and delivers ruin. The injury you brood over harms you more than the act that caused it.',
    quotes: [
      { text: 'How much more grievous are the consequences of anger than the causes of it.', who: 'Marcus Aurelius' },
      { text: 'Anger, if not restrained, is frequently more hurtful to us than the injury that provokes it.', who: 'Seneca' },
    ],
    practice:
      'When provoked, delay your response by one breath, then ten. Ask whether the offence was in the event or in your judgment of it. You command the second.',
  },
  {
    id: 'adversity',
    keywords: ['adversity', 'hard', 'difficult', 'struggle', 'setback', 'obstacle', 'fail', 'failure', 'lost', 'rejected', 'rejection', 'quit', 'give up', 'stuck'],
    reflection:
      'The obstacle is not in your way — it is the way. What blocks the path becomes the path once you change how you meet it.',
    quotes: [
      { text: 'The impediment to action advances action. What stands in the way becomes the way.', who: 'Marcus Aurelius' },
      { text: 'A gem cannot be polished without friction, nor a man perfected without trials.', who: 'Seneca' },
      { text: 'It is not what happens to you, but how you react to it that matters.', who: 'Epictetus' },
    ],
    practice:
      'Treat this difficulty as a training partner sent to strengthen you. Ask: what virtue does this moment call for — patience, courage, persistence? Then supply it.',
  },
  {
    id: 'control',
    keywords: ['control', 'cant change', "can't change", 'out of my hands', 'others', 'unfair', 'expectation', 'let go', 'accept'],
    reflection:
      'Peace begins the instant you divide the world into what is yours to govern and what is not. Pour your effort into the first; greet the second without complaint.',
    quotes: [
      { text: 'Some things are within our power, and some are not.', who: 'Epictetus' },
      { text: 'Make the best use of what is in your power, and take the rest as it happens.', who: 'Epictetus' },
    ],
    practice:
      'List your worry’s parts. Cross out everything outside your control. Act only on what remains — your effort, your attitude, your next choice.',
  },
  {
    id: 'desire',
    keywords: ['desire', 'want more', 'money', 'rich', 'wealth', 'envy', 'jealous', 'greed', 'enough', 'content', 'material', 'crave'],
    reflection:
      'Riches are not in the having but in the wanting little. The man who needs least is nearest to the gods.',
    quotes: [
      { text: 'It is not the man who has too little, but the man who craves more, that is poor.', who: 'Seneca' },
      { text: 'Wealth consists not in having great possessions, but in having few wants.', who: 'Epictetus' },
      { text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.', who: 'Marcus Aurelius' },
    ],
    practice:
      'Each morning, name three things you already have that you once hoped for. Want what you have before you chase what you don’t.',
  },
  {
    id: 'comparison',
    keywords: ['compare', 'comparison', 'opinion', 'judge', 'judgment', 'what people think', 'social media', 'validation', 'approval', 'insecure'],
    reflection:
      'You love yourself more than others, yet prize their opinion above your own. Live by your judgment of the good, not the applause of the crowd.',
    quotes: [
      { text: 'It never ceases to amaze me: we all love ourselves more than other people, but care more about their opinion than our own.', who: 'Marcus Aurelius' },
      { text: 'If you want to improve, be content to be thought foolish and stupid.', who: 'Epictetus' },
    ],
    practice:
      'Compare yourself only to who you were yesterday. When you reach for another’s opinion, ask first: is the judge wise, and is the matter within my control?',
  },
  {
    id: 'mortality',
    keywords: ['death', 'die', 'mortal', 'meaning of life', 'short', 'regret', 'legacy', 'memento'],
    reflection:
      'You will not live forever — and that is not morbid but clarifying. Death is the great editor of trivial things.',
    quotes: [
      { text: 'Think of yourself as dead. You have lived your life. Now take what’s left and live it properly.', who: 'Marcus Aurelius' },
      { text: 'Let us prepare our minds as if we’d come to the very end of life. Let us postpone nothing.', who: 'Seneca' },
    ],
    practice:
      'Ask of any choice: if this were among my last days, would I still do it, still say it, still worry over it? Let the answer prune your hours.',
  },
  {
    id: 'gratitude',
    keywords: ['gratitude', 'grateful', 'thankful', 'appreciate', 'happy', 'happiness', 'joy', 'content'],
    reflection:
      'Happiness is not assembled from what you lack but uncovered in what you already hold. The quality of your life is the quality of your thoughts.',
    quotes: [
      { text: 'When you arise in the morning, think of what a precious privilege it is to be alive — to breathe, to think, to enjoy, to love.', who: 'Marcus Aurelius' },
      { text: 'He is a wise man who does not grieve for the things he has not, but rejoices for those which he has.', who: 'Epictetus' },
    ],
    practice:
      'Tonight, write three specific things from today you are grateful for. Specificity is the soul of gratitude — not “my health,” but “the cold air on the walk.”',
  },
  {
    id: 'purpose',
    keywords: ['purpose', 'meaning', 'direction', 'lost', 'why', 'goal', 'values', 'virtue', 'good life', 'ikigai'],
    reflection:
      'Do not search the horizon for purpose while neglecting the duty in front of you. Purpose is built in the doing of the right thing, now.',
    quotes: [
      { text: 'Just that you do the right thing. The rest doesn’t matter.', who: 'Marcus Aurelius' },
      { text: 'First say to yourself what you would be; and then do what you have to do.', who: 'Epictetus' },
    ],
    practice:
      'Name the person you wish to become in one sentence. Then choose one act today that only that person would do, and do it.',
  },
  {
    id: 'effort',
    keywords: ['tired', 'comfort', 'bed', 'morning', 'wake', 'hard work', 'effort', 'gym', 'train', 'exercise', 'pain'],
    reflection:
      'Comfort is a soft tyrant. You were not made to huddle under blankets and be warm — you were made to act, to work, to play your part.',
    quotes: [
      { text: 'At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.', who: 'Marcus Aurelius' },
      { text: 'Difficulties strengthen the mind, as labor does the body.', who: 'Seneca' },
    ],
    practice:
      'When comfort argues for delay, move your body first — stand, step, three breaths — then begin the task within sixty seconds. Action dissolves resistance.',
  },
  {
    id: 'focus',
    keywords: ['focus', 'distract', 'scattered', 'attention', 'concentrat', 'busy', 'overwhelmed', 'multitask'],
    reflection:
      'To be everywhere is to be nowhere. The scattered mind accomplishes little; the gathered mind moves mountains one stone at a time.',
    quotes: [
      { text: 'Concentrate every minute on doing what’s in front of you with precise and genuine seriousness.', who: 'Marcus Aurelius' },
      { text: 'To be everywhere is to be nowhere.', who: 'Seneca' },
    ],
    practice:
      'Pick one task. Remove every other window, tab, and temptation. Work it for a single, unbroken block. Then, and only then, choose the next.',
  },
]

const GENERAL: Quote[] = [
  { text: 'The happiness of your life depends upon the quality of your thoughts.', who: 'Marcus Aurelius' },
  { text: 'Every new beginning comes from some other beginning’s end.', who: 'Seneca' },
  { text: 'It’s not what happens to you, but how you react to it that matters.', who: 'Epictetus' },
  { text: 'Waste no more time arguing about what a good man should be. Be one.', who: 'Marcus Aurelius' },
]

// hard off-topic — ALWAYS decline, even if a personal word slips in
const STRONG_OFFTOPIC = [
  'weather', 'stock', 'crypto', 'bitcoin', 'recipe', 'cook', 'translate', 'capital of', 'population',
  'code', 'coding', 'javascript', 'python', 'sql', 'script', 'program', 'math', 'calculate',
  'homework', 'essay', 'write me', 'who won', 'movie', 'song', 'lyrics', 'celebrity', 'news',
  'wifi', 'phone number', 'directions', 'flight', 'hotel', 'price of', 'buy ', 'discount',
  'score', 'football', 'soccer', 'nba',
]

// softer off-topic — decline only if there's no personal/self-improvement signal
const OFFTOPIC = ['who is', 'what is the', 'when is', 'where is', 'how much', 'how many']

const SELF_SIGNALS = [
  'i ', "i'm", 'my ', 'myself', 'feel', 'should i', 'how do i', 'how can i', 'help me with',
  'advice', 'better at', 'improve', 'self', 'habit', 'fear', 'anxious', 'angry', 'sad', 'lost',
  'stuck', 'discipline', 'focus', 'goal', 'change my', 'become', 'motivat', 'procrastinat',
  'confidence', 'purpose', 'meaning', 'stress', 'overwhelm', 'quit', 'fail', 'lazy', 'wake up',
]

export interface StoicReply {
  text: string
  attributions: Speaker[]
}

const OPENERS = [
  'The council answers as one.',
  'Hear us, seeker.',
  'Sit, and consider.',
  'A worthy question. Reflect with us.',
]

function pickTheme(q: string): Theme | null {
  const l = q.toLowerCase()
  let best: Theme | null = null
  let bestScore = 0
  for (const t of THEMES) {
    let score = 0
    for (const k of t.keywords) if (l.includes(k)) score += 1
    if (score > bestScore) {
      bestScore = score
      best = t
    }
  }
  return bestScore > 0 ? best : null
}

export function isOnTopic(q: string): boolean {
  const l = q.toLowerCase().trim()
  if (l.length < 2) return false
  // hard off-topic always declines
  if (STRONG_OFFTOPIC.some((k) => l.includes(k))) return false
  const self = SELF_SIGNALS.some((k) => l.includes(k))
  // a factual-question signal without any personal signal → decline
  if (OFFTOPIC.some((k) => l.includes(k)) && !self) return false
  if (pickTheme(l)) return true
  return self
}

export function counsel(question: string): StoicReply {
  if (!isOnTopic(question)) {
    return {
      text:
        'That lies outside our concern. We are teachers of one art only — the art of living well: how to master yourself, meet hardship, and become who you intend to be. Ask us of that, and we will not be silent.',
      attributions: [],
    }
  }

  const theme = pickTheme(question)
  const opener = OPENERS[Math.floor(Math.random() * OPENERS.length)]

  if (!theme) {
    const q = GENERAL[Math.floor(Math.random() * GENERAL.length)]
    return {
      text: `${opener}\n\nRemember this: “${q.text}” — ${q.who}.\n\nWhatever troubles you, return to what is yours to control — your judgment, your effort, your next action — and let the rest unfold as it will. Name one small, virtuous step you can take today, and take it.`,
      attributions: [q.who],
    }
  }

  // weave two quotes from different speakers where possible
  const quotes = [...theme.quotes]
  const first = quotes[Math.floor(Math.random() * quotes.length)]
  const second = quotes.find((x) => x.who !== first.who)
  const used: Quote[] = second ? [first, second] : [first]

  const quoteLines = used.map((x) => `“${x.text}” — ${x.who}.`).join('\n')

  return {
    text: `${opener}\n\n${theme.reflection}\n\n${quoteLines}\n\n${theme.practice}`,
    attributions: Array.from(new Set(used.map((x) => x.who))),
  }
}

export const STARTER_PROMPTS = [
  'How do I stop procrastinating?',
  'I feel anxious about the future.',
  'How do I build self-discipline?',
  'I keep comparing myself to others.',
  'How do I deal with a setback?',
  'I struggle to wake up and train.',
]
