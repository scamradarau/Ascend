// ================================================================
// THE STOIC — a single sage whose mind is distilled from the whole
// Stoa: the rigour of Epictetus, the warmth of Seneca, the inward
// steadiness of Marcus Aurelius, fused into ONE voice. It does not
// speak as three people; it speaks as one teacher who has absorbed
// them all.
//
// Self-contained (no external API/key, fully private): it matches a
// question to Stoic themes and composes a layered reply — a reflection,
// the underlying principle, remembered words from the tradition, a
// concrete practice, and a closing charge. It answers only the art of
// living well; everything else it gently declines, in character.
// (Upgradeable to a live LLM via the backend — see BACKEND_PLAN.md.)
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
  lens: string
  quotes: Quote[]
  practice: string
}

const THEMES: Theme[] = [
  {
    id: 'discipline',
    keywords: ['discipline', 'lazy', 'lazi', 'willpower', 'self-control', 'self control', 'consistent', 'consistency', 'motivat', 'procrastinat', 'distract', 'focus', 'habit'],
    reflection:
      'Discipline is not punishment — it is the freedom to become who you intend to be. The undisciplined are ruled by every passing mood; the disciplined rule themselves, and so are ruled by no one.',
    lens:
      'The old teachers called this self-command — not the grim denial of every pleasure, but the quiet sovereignty of a mind that obeys itself. Each time you refuse a small impulse, you widen the borders of your own freedom.',
    quotes: [
      { text: 'No man is free who is not master of himself.', who: 'Epictetus' },
      { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', who: 'Marcus Aurelius' },
      { text: 'Most powerful is he who has himself in his own power.', who: 'Seneca' },
    ],
    practice:
      'Choose one small action you will perform today regardless of how you feel — then do it before you negotiate with yourself. Tomorrow, the same. Mastery is not a mood you wait for; it is a rep you repeat until the man and the habit are one.',
  },
  {
    id: 'procrastination',
    keywords: ['procrastinat', 'put off', 'putting off', 'keep delaying', 'do it later', 'waste time', 'wasting time', 'time management', 'lazy to start'],
    reflection:
      'You do not lack time — you spend it as though the supply were endless. Treat each day as a whole life in miniature, with its own dawn and reckoning, and the postponing mind loses its grip.',
    lens:
      'Time is the one possession you can never earn back. To delay the good is to trade an irreplaceable hour of a finite life for a comfort you will not even remember by nightfall.',
    quotes: [
      { text: 'It is not that we have a short time to live, but that we waste a lot of it.', who: 'Seneca' },
      { text: 'You could leave life right now. Let that determine what you do and say and think.', who: 'Marcus Aurelius' },
      { text: 'No longer talk about the kind of man a good man ought to be — be such.', who: 'Epictetus' },
    ],
    practice:
      'Name the single most important task, then do it first — before the inbox, before the noise. Begin badly if you must; momentum forgives a clumsy start, but it never forgives a start that never comes.',
  },
  {
    id: 'fear',
    keywords: ['fear', 'afraid', 'anxious', 'anxiety', 'worry', 'worried', 'nervous', 'scared', 'overwhelm', 'panic', 'stress'],
    reflection:
      'Most of your suffering is rehearsal — disasters your imagination stages in vivid detail that never arrive. Meet the fear plainly, in daylight, and it shrinks to its true and far smaller size.',
    lens:
      'Fear lives almost wholly in the future — a country that does not yet exist and may never. Drag it into the present and ask it for evidence, and most of it dissolves for lack of any.',
    quotes: [
      { text: 'We suffer more often in imagination than in reality.', who: 'Seneca' },
      { text: 'Today I escaped from anxiety. Or no — I discarded it, because it was within me.', who: 'Marcus Aurelius' },
    ],
    practice:
      'Write the worst case in plain, unflinching words. Then ask two questions: could I endure it, and could I recover from it? Almost always the answer to both is yes. Act on the part you control; release the rest without apology.',
  },
  {
    id: 'anger',
    keywords: ['anger', 'angry', 'frustrat', 'rage', 'irritat', 'annoy', 'resent', 'temper', 'mad'],
    reflection:
      'Anger promises strength and delivers ruin. The injury you brood over harms you longer and deeper than the act that first provoked it — you become your own second assailant.',
    lens:
      'Anger is a brief madness that mistakes itself for justice. No one can truly wrong you but yourself, for the wound is not in the deed but in your judgment about the deed — and the judgment is yours to revise.',
    quotes: [
      { text: 'How much more grievous are the consequences of anger than the causes of it.', who: 'Marcus Aurelius' },
      { text: 'Anger, if not restrained, is frequently more hurtful to us than the injury that provokes it.', who: 'Seneca' },
    ],
    practice:
      'When provoked, delay your response by one breath, then ten. In that gap, ask whether the offence lives in the event or in your opinion of it. The event you cannot always change; the opinion you command absolutely.',
  },
  {
    id: 'adversity',
    keywords: ['adversity', 'hard', 'difficult', 'struggle', 'setback', 'obstacle', 'fail', 'failure', 'lost', 'rejected', 'rejection', 'quit', 'give up', 'stuck'],
    reflection:
      'The obstacle is not in your way — it is the way. What blocks the path becomes the path the instant you change how you meet it. The same wind that sinks one ship carries another home.',
    lens:
      'This is amor fati — to love your fate. The Stoic does not merely endure hardship but puts it to work as the raw material of virtue, the way fire does not destroy the blade but tempers it.',
    quotes: [
      { text: 'The impediment to action advances action. What stands in the way becomes the way.', who: 'Marcus Aurelius' },
      { text: 'A gem cannot be polished without friction, nor a man perfected without trials.', who: 'Seneca' },
      { text: 'It is not what happens to you, but how you react to it that matters.', who: 'Epictetus' },
    ],
    practice:
      'Treat this difficulty as a sparring partner sent to strengthen you, not an enemy sent to break you. Ask: which virtue does this exact moment call for — patience, courage, persistence, restraint? Name it, then supply it.',
  },
  {
    id: 'control',
    keywords: ['control', 'cant change', "can't change", 'out of my hands', 'others', 'unfair', 'expectation', 'let go', 'accept'],
    reflection:
      'Peace begins the instant you divide the world cleanly into what is yours to govern and what is not. Pour your whole effort into the first; greet the second, when it comes, without argument or complaint.',
    lens:
      'This is the hinge on which the entire philosophy turns — the dichotomy of control. Some things are up to us: our choices, our effort, our assent. Some are not: the weather, the past, the opinions and actions of others. Suffering is caring for the second as if it were the first.',
    quotes: [
      { text: 'Some things are within our power, and some are not.', who: 'Epictetus' },
      { text: 'Make the best use of what is in your power, and take the rest as it happens.', who: 'Epictetus' },
      { text: 'You have power over your mind — not outside events.', who: 'Marcus Aurelius' },
    ],
    practice:
      'Take your worry and break it into parts on paper. Strike out every line that lies outside your control. Whatever remains — your effort, your attitude, your next decision — is your whole and only assignment. Work it.',
  },
  {
    id: 'desire',
    keywords: ['desire', 'want more', 'money', 'rich', 'wealth', 'envy', 'jealous', 'greed', 'enough', 'content', 'material', 'crave'],
    reflection:
      'Riches are not in the having but in the wanting little. The one who needs least is freest, for he has the fewest masters; every craving is a leash you hand to the world.',
    lens:
      'Wealth is measured not by what you hold but by what you can calmly do without. The shortest road to abundance is therefore not acquiring more, but desiring less — and that road is open to you this very hour.',
    quotes: [
      { text: 'It is not the man who has too little, but the man who craves more, that is poor.', who: 'Seneca' },
      { text: 'Wealth consists not in having great possessions, but in having few wants.', who: 'Epictetus' },
      { text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.', who: 'Marcus Aurelius' },
    ],
    practice:
      'Each morning, name three things you already possess that you once longed for and now barely notice. Learn to want what you have before you set off again to chase what you do not.',
  },
  {
    id: 'comparison',
    keywords: ['compare', 'comparison', 'opinion', 'judge', 'judgment', 'what people think', 'social media', 'validation', 'approval', 'insecure'],
    reflection:
      'You love yourself more than you love others, yet you prize their opinion above your own. Live by your own reasoned judgment of the good, not by the applause or the silence of the crowd.',
    lens:
      'The opinions of others are not within your power, and what is not in your power is not yours to carry. Build your worth on the one foundation no one can grant or seize — your own conduct, weighed honestly against your own standard.',
    quotes: [
      { text: 'It never ceases to amaze me: we all love ourselves more than other people, but care more about their opinion than our own.', who: 'Marcus Aurelius' },
      { text: 'If you want to improve, be content to be thought foolish and stupid.', who: 'Epictetus' },
    ],
    practice:
      'Measure yourself against only one rival: the person you were yesterday. And when you reach for another’s opinion, ask first whether the judge is wise and whether the matter is even within your control. Usually neither is true.',
  },
  {
    id: 'mortality',
    keywords: ['death', 'die', 'mortal', 'meaning of life', 'short', 'regret', 'legacy', 'memento'],
    reflection:
      'You will not live forever — and that is not morbid but clarifying. The thought of death is the great editor of trivial things; held lightly, it makes the present hour vivid and the small grievance absurd.',
    lens:
      'This is memento mori — remember that you must die. Not to cast a shadow over life, but to strike out everything petty: who would waste an irreplaceable afternoon on resentment, if he truly counted his afternoons?',
    quotes: [
      { text: 'Think of yourself as dead. You have lived your life. Now take what’s left and live it properly.', who: 'Marcus Aurelius' },
      { text: 'Let us prepare our minds as if we’d come to the very end of life. Let us postpone nothing.', who: 'Seneca' },
    ],
    practice:
      'Hold any choice up to a single question: if this were among my last days, would I still do it, still say it, still gnaw on this worry? Let the honest answer prune your hours down to what matters.',
  },
  {
    id: 'gratitude',
    keywords: ['gratitude', 'grateful', 'thankful', 'appreciate', 'happy', 'happiness', 'joy', 'content'],
    reflection:
      'Happiness is not assembled from what you lack but uncovered in what you already hold. The quality of your life is, in the end, simply the quality of your thoughts — and that you may improve today.',
    lens:
      'The Stoic does not hunt happiness as a prize to be won someday; he receives it as a posture held now — attention turned deliberately toward what has been given, rather than fixed on what is still wanted.',
    quotes: [
      { text: 'When you arise in the morning, think of what a precious privilege it is to be alive — to breathe, to think, to enjoy, to love.', who: 'Marcus Aurelius' },
      { text: 'He is a wise man who does not grieve for the things he has not, but rejoices for those which he has.', who: 'Epictetus' },
    ],
    practice:
      'Tonight, write three specific things from this day you are grateful for. Specificity is the soul of gratitude — not “my health,” but “the cold air on the morning walk.” The vague heart feels nothing; the precise one overflows.',
  },
  {
    id: 'purpose',
    keywords: ['purpose', 'meaning', 'direction', 'lost', 'why', 'goal', 'values', 'virtue', 'good life', 'ikigai'],
    reflection:
      'Do not scan the far horizon for your purpose while neglecting the plain duty in front of you. Purpose is not discovered in the distance; it is built, here, in the doing of the right thing now.',
    lens:
      'Act according to your nature as a reasoning, social creature — do the just thing, the useful thing, the honest thing in this hour — and meaning follows you like a shadow, without ever being chased.',
    quotes: [
      { text: 'Just that you do the right thing. The rest doesn’t matter.', who: 'Marcus Aurelius' },
      { text: 'First say to yourself what you would be; and then do what you have to do.', who: 'Epictetus' },
    ],
    practice:
      'Name, in one sentence, the person you intend to become. Then choose one act today that only that person would do — and do it, however small. A character is nothing but a long column of such acts.',
  },
  {
    id: 'effort',
    keywords: ['tired', 'comfort', 'bed', 'morning', 'wake', 'hard work', 'effort', 'gym', 'train', 'exercise', 'pain'],
    reflection:
      'Comfort is a soft tyrant — it asks for so little and slowly takes everything. You were not made to huddle warm beneath blankets; you were made to act, to work, to play your part in the world.',
    lens:
      'The body and the will both wither in ease and strengthen under load. Labour is not the price you pay for the good life — it is the substance of it. The struggle you are avoiding is the very thing that would make you strong.',
    quotes: [
      { text: 'At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.', who: 'Marcus Aurelius' },
      { text: 'Difficulties strengthen the mind, as labor does the body.', who: 'Seneca' },
    ],
    practice:
      'When comfort argues for delay, move the body before you consult the mind — stand, step, take three breaths — then begin the task within sixty seconds. Resistance is a fog; motion is the wind that clears it.',
  },
  {
    id: 'focus',
    keywords: ['focus', 'distract', 'scattered', 'attention', 'concentrat', 'busy', 'overwhelmed', 'multitask'],
    reflection:
      'To be everywhere is to be nowhere. The scattered mind accomplishes little and feels much; the gathered mind moves mountains, one deliberate stone at a time.',
    lens:
      'The mind, like a field, yields a harvest only where it is concentrated. Spread your attention thin across many things and you reap nothing from any; gather it whole onto one, and what seemed immovable begins to give.',
    quotes: [
      { text: 'Concentrate every minute on doing what’s in front of you with precise and genuine seriousness.', who: 'Marcus Aurelius' },
      { text: 'To be everywhere is to be nowhere.', who: 'Seneca' },
    ],
    practice:
      'Choose one task. Close every other window, tab, and temptation — make the room quiet. Work it in a single unbroken block. Only when it is done do you earn the right to choose the next.',
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

// single-voice openers and closings — the sage speaks as ONE mind
const OPENERS = [
  'Sit with me a moment.',
  'Come, let us reason this through together.',
  'I have turned this question over many times. Hear what the years have taught me.',
  'You ask well. Be still, and listen.',
  'Steady yourself, and consider it with me.',
]

const CLOSINGS = [
  'Begin now, while the resolve is still warm — the first small act is the whole of it.',
  'Do not wait to feel ready. Act, and the readiness will arrive behind you.',
  'Return to this when the world grows loud. The work is always, only, the next right action.',
  'You already know what must be done. Go now, and be it.',
  'Let this be enough for today. Tomorrow, the same climb — one step higher.',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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
        'My art is a narrow one, and I will not pretend otherwise. I teach a single craft — the craft of living well: how to master yourself, meet hardship without breaking, and become the person you intend to be. Bring me that, and I will not be silent. The rest belongs to other teachers.',
      attributions: [],
    }
  }

  const opener = pick(OPENERS)
  const closing = pick(CLOSINGS)
  const theme = pickTheme(question)

  if (!theme) {
    const q = pick(GENERAL)
    return {
      text:
        `${opener}\n\n` +
        'Whatever name your trouble wears, it yields to one discipline: separate cleanly what is yours to govern — your judgment, your effort, your next act — from what is not, and then spend yourself wholly on the first.\n\n' +
        `Hold this close: “${q.text}” — so wrote ${q.who}, and I have found it true.\n\n` +
        'Name one small, virtuous step that lies within your power, and take it before the day cools. Then another tomorrow. A life is built this way, or it is not built at all.\n\n' +
        `${closing}`,
      attributions: [q.who],
    }
  }

  // weave two remembered lines from different teachers where possible
  const quotes = shuffle(theme.quotes)
  const first = quotes[0]
  const second = quotes.find((x) => x.who !== first.who)
  const used: Quote[] = second ? [first, second] : [first]

  const quoteProse =
    used.length === 2
      ? `“${used[0].text}” And again: “${used[1].text}”`
      : `“${used[0].text}”`
  const who = Array.from(new Set(used.map((x) => x.who))).join(' and ')

  return {
    text:
      `${opener}\n\n` +
      `${theme.reflection}\n\n` +
      `${theme.lens}\n\n` +
      `Carry these words with you: ${quoteProse} — so taught ${who}, and the centuries have not worn them down.\n\n` +
      `Now to your practice. ${theme.practice}\n\n` +
      `${closing}`,
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
