import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PixelTitle, Pill } from '../components/ui'
import { ATTRIBUTES } from '../data/attributes'
import { VERIFICATION_METHODS } from '../data/verification'
import { RANKS } from '../data/ranks'
import { TRAITS } from '../data/traits'

// ================================================================
// CODEX - the in-game user guide / manual.
// ================================================================

interface Section {
  id: string
  title: string
  icon: string
  body: React.ReactNode
}

function Callout({ tone = 'cyan', children }: { tone?: 'cyan' | 'gold' | 'magenta'; children: React.ReactNode }) {
  const map = {
    cyan: 'border-cosmos-cyan/30 bg-cosmos-cyan/5 text-cosmos-cyan',
    gold: 'border-cosmos-gold/30 bg-cosmos-gold/5 text-cosmos-gold',
    magenta: 'border-cosmos-magenta/30 bg-cosmos-magenta/5 text-cosmos-magenta',
  }
  return <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${map[tone]}`}>{children}</div>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-slate-300">{children}</p>
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-[var(--accent)]">▹</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

const SECTIONS: Section[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    icon: '🎮',
    body: (
      <>
        <P>
          Ascend treats self-improvement like game progression. Instead of vague goals, you get a
          visible character with stats, EXP bars, levels, quests and ranks - so you always know{' '}
          <em>where you are</em> and <em>exactly what to do next</em>.
        </P>
        <P>
          The loop is simple: <strong>pick your quests → prove the work daily → earn EXP, level your
          traits and your character → climb ranks, slay challenge bosses and watch your World Map
          light up.</strong>
        </P>
        <Callout>
          Golden rule: the honest path is the fast path. Every quest is verified, so the only way to
          level is to actually do the work. That’s the whole point.
        </Callout>
      </>
    ),
  },
  {
    id: 'install',
    title: 'Install the App',
    icon: '📲',
    body: (
      <>
        <P>
          Ascend runs in your browser, but you can install it like a real app - your own icon, full
          screen, and daily reminder notifications. Takes about 15 seconds.
        </P>
        <div className="mt-4 font-semibold text-white">📱 iPhone / iPad (Safari)</div>
        <List
          items={[
            <>Open Ascend in <strong>Safari</strong> (not another browser).</>,
            <>Tap the <strong>Share</strong> button - the square with an up-arrow.</>,
            <>Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</>,
            <>Open Ascend from the new icon, then turn on reminders in <strong>Settings → Notifications</strong>.</>,
          ]}
        />
        <div className="mt-4 font-semibold text-white">🤖 Android (Chrome)</div>
        <List
          items={[
            <>Open Ascend in <strong>Chrome</strong>.</>,
            <>Tap the <strong>⋮</strong> menu (top-right).</>,
            <>Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</>,
          ]}
        />
        <div className="mt-4 font-semibold text-white">💻 Desktop (Chrome / Edge)</div>
        <List
          items={[<>Click the <strong>install icon</strong> in the address bar, or ⋮ menu → <strong>Install Ascend</strong>.</>]}
        />
        <Callout tone="gold">
          On iPhone, notifications only work <strong>after</strong> you add Ascend to the Home Screen and
          open it from that icon (iOS 16.4+). Android &amp; desktop work straight from the browser.
        </Callout>
      </>
    ),
  },
  {
    id: 'character',
    title: 'Your Character',
    icon: '🧬',
    body: (
      <>
        <P>
          Your character has five core <strong>attributes</strong>. Every trait you build rolls up
          into one of them.
        </P>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ATTRIBUTES.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3">
              <span className="text-2xl" style={{ color: a.color }}>{a.icon}</span>
              <div>
                <div className="font-display font-bold text-white">
                  {a.name} <span className="text-xs text-[var(--muted)]">/ {a.short}</span>
                </div>
                <div className="text-xs text-[var(--muted)]">{a.blurb}</div>
              </div>
            </div>
          ))}
        </div>
        <P>
          <strong>EXP &amp; levels:</strong> verified quests grant EXP to the trait and to your
          overall character. Each level needs a little more EXP than the last, so progress is steady
          and earned. Your character level sets your <strong>rank</strong>.
        </P>
      </>
    ),
  },
  {
    id: 'traits',
    title: 'Main Quests & staying focused',
    icon: '🧠',
    body: (
      <>
        <P>
          The <strong>Main Quests</strong> page holds {TRAITS.length}+ traits across the five Paths -
          confidence, focus, discipline, resilience, charisma, physique and many more. Each is a
          skill you can level with specific, proven actions, and your progress lights up its region
          on the <strong>World Map</strong>.
        </P>
        <Callout tone="gold">
          You build up to <strong>3 traits at a time</strong> - <strong>Ascend Plus</strong> raises
          that to <strong>5</strong>. Either way, focus beats scatter. Once you start a trait’s{' '}
          <strong>main quest</strong>, you’re committed until it’s finished - no flip-flopping. This
          is by design: it builds trust in the process.
        </Callout>
        <P>Each trait page is a mini-library: what it is, why it helps, how to level it, daily tasks, a main-quest book, and hot tips.</P>
      </>
    ),
  },
  {
    id: 'quests',
    title: 'Quests',
    icon: '📜',
    body: (
      <>
        <P>
          <strong>Daily quests</strong> are small, repeatable actions (meditate 10 min, train, read,
          reflect). They reset every day and keep your streak alive.
        </P>
        <P>
          <strong>Main quests</strong> are bigger commitments with two paths: read a great book and
          apply it (4 check-ins), or take the <strong>2-week practical challenge</strong> - lock in
          your commitment, then prove it with one photo check-in per day for 14 days. Either way,
          the big EXP payout lands when you <em>finish</em> the quest, not per check-in.
        </P>
        <P>
          <strong>Weekly &amp; monthly challenges</strong> work the same way: each verified log
          (max one per day) moves the progress bar, and the full EXP + Aether is paid out{' '}
          <strong>in one hit when you complete every session before the reset</strong>. Miss the
          target and the period resets with no payout - the reward is for finishing, not for
          showing up once.
        </P>
        <List
          items={[
            'Check a quest to log it - you’ll be prompted to verify it (see below).',
            'Verified = EXP + Aether (Aether is always EXP ÷ 4). Pending = awaiting review, pays nothing until approved. Flagged = nothing.',
            'Multi-step quests (mains, weeklies, monthlies) pay their full reward only on completion.',
            'One completion per quest per day - days roll over at midnight Sydney time. No backfilling yesterday.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'freezes',
    title: 'Streak Freezes',
    icon: '🧊',
    body: (
      <>
        <P>
          A <strong>Streak Freeze</strong> protects your streak across a missed day. Miss a day with a
          freeze banked and it’s spent automatically to bridge the gap - your chain stays alive instead
          of resetting to zero. It’s insurance for real life: a sick day, travel, a flat-out week.
        </P>
        <P>How you accumulate them:</P>
        <List
          items={[
            'You start with one freeze in your pocket.',
            'You earn one free freeze every week - it banks automatically (no action needed).',
            'You can also buy extra freezes with Aether (◈250 each) from the Character page.',
            'They’re spent automatically, oldest first, the moment a missed day would have broken your streak.',
          ]}
        />
        <Callout tone="gold">
          You can bank up to <strong>2 freezes</strong> on a free account - <strong>Ascend Plus</strong>{' '}
          raises the cap to <strong>4</strong>, so you can cover a longer break (a holiday, exam week)
          without losing months of momentum.
        </Callout>
        <P>
          Smart play: top up <em>before</em> a busy stretch, not during it. A freeze can only save a
          streak if it’s already in the bank when the day slips.
        </P>
      </>
    ),
  },
  {
    id: 'verification',
    title: 'Quest Verification',
    icon: '🛡️',
    body: (
      <>
        <P>
          Proof is the heart of Ascend. Each quest type has a verification method matched to the
          activity. Here’s what each asks of you and why it can’t be faked:
        </P>
        <div className="mt-3 space-y-2">
          {Object.values(VERIFICATION_METHODS).map((m) => (
            <div key={m.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{m.icon}</span>
                <span className="font-display font-bold text-white">{m.label}</span>
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">{m.blurb}</div>
              <div className="mt-1.5 text-[11px] text-exp">✓ {m.defenses[0]}</div>
            </div>
          ))}
        </div>
        <Callout tone="magenta">
          Photo quests use your <strong>live camera only</strong> - there’s no upload button, so old
          or saved photos simply can’t be submitted. A one-time code &amp; timestamp are stamped into
          every capture.
        </Callout>
      </>
    ),
  },
  {
    id: 'integrity',
    title: 'Integrity Score',
    icon: '💎',
    body: (
      <>
        <P>
          Your <strong>Integrity score</strong> (0–100, shown in the header) is your trust rating.
          Clean verified proofs raise it; flagged or rejected ones lower it.
        </P>
        <List
          items={[
            <><strong>Real rewards require an Integrity of 80+.</strong> Cheating gets submissions flagged, which drops your Integrity below the line and locks you out of rewards - so faking your way to a prize is self-defeating.</>,
            'Flagged submissions go to human review - approved restores trust, rejected docks it.',
            'Integrity recovers as you complete honest, verified quests. It’s the cheapest thing to protect and the most expensive to lose. Play straight.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'ranks',
    title: 'Ranks & Expectations',
    icon: '🎖️',
    body: (
      <>
        <P>
          Your level places you in a <strong>rank</strong>. Each rank sets the life expectations for
          that tier - a motivating north star, not a literal rulebook.
        </P>
        <div className="mt-3 space-y-1.5">
          {RANKS.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-2.5 text-sm">
              <span className="w-10 shrink-0 font-pixel text-[10px] text-[var(--accent)]">{r.minLevel}</span>
              <span className="w-28 shrink-0 font-display font-bold uppercase tracking-wide text-white">{r.title}</span>
              <span className="text-xs text-[var(--muted)]">{r.expectations.slice(0, 2).join(' · ')}…</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'economy',
    title: 'Aether, Shop & Rewards',
    icon: '◈',
    body: (
      <>
        <P>
          <strong>Aether (◈)</strong> is the currency you earn from verified quests. Spend it in the{' '}
          <Link to="/app/shop" className="text-[var(--accent)] underline">Shop</Link>.
        </P>
        <List
          items={[
            'Cosmetics - auras, frames, energy cores and helmets for your avatar.',
            'Real-world rewards - coupons, gift cards, memberships, tech and cash, funded by sponsors.',
            'High-value rewards check your integrity score before fulfilment.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'badges',
    title: 'Badges, Items & Seasons',
    icon: '🏆',
    body: (
      <>
        <P>
          <strong>Badges</strong> are multi-step achievements (e.g. Entrepreneur, Scholar, Iron Will)
          that pay the biggest rewards. <strong>Items</strong> are cosmetic effects earned by streaks
          and milestones.
        </P>
        <P>
          <strong>Seasons</strong> are a rotating track of tiered rewards - every bit of EXP you earn
          also fills your season pass, so there’s always something to climb toward.
        </P>
      </>
    ),
  },
  {
    id: 'leaderboards',
    title: 'Leaderboards & Guild',
    icon: '🛡️',
    body: (
      <>
        <P>
          Three <strong>leaderboards</strong> - Legendary (overall level), Stat (trait level) and
          Quests (this month). Top players earn rotating real rewards so everyone gets a fair shot.
        </P>
        <P>
          The <strong>Guild</strong> is one big community - share wins, find accountability partners
          and climb together. You go faster alone; you go further together.
        </P>
      </>
    ),
  },
  {
    id: 'strategy',
    title: 'Pro Strategy',
    icon: '⚡',
    body: (
      <>
        <List
          items={[
            'Pick one foundational trait first (Focus, Self-Discipline or Vitality) - it multiplies everything else.',
            'Never miss twice. A single missed day is a slip; two is the start of a new (bad) habit.',
            'Stack quests onto existing routines (after coffee → meditate). Triggers beat willpower.',
            'Finish main-quest books - they’re the biggest EXP and unlock Scholar.',
            'Protect your streak; protect your integrity. Both compound.',
            'Use the Guild for accountability - public commitment lifts follow-through.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: '❓',
    body: (
      <>
        <div className="space-y-3">
          {[
            ['Why is there a trait limit?', 'Focus. Spreading thin is why most self-improvement fails. Free players run 3 traits at once; Ascend Plus unlocks 5. A tight set keeps you consistent and lets you actually finish.'],
            ['Can I change my traits?', 'Yes - until you start a main quest. Once committed, finish it. You can swap freely before that.'],
            ['Why can’t I upload a photo from my gallery?', 'Because that’s the #1 way people cheat. Live capture only keeps the leaderboards and rewards meaningful.'],
            ['Is the life-expectations page literal?', 'No - it’s motivational and for entertainment. Anything more or less, request a rank change.'],
            ['What happens if I’m flagged unfairly?', 'It goes to human review. If approved, your EXP and integrity are restored.'],
            ['Does my progress save?', 'Yes - locally in your browser for this build. A full account/cloud sync is the production next step.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
              <div className="font-display font-bold text-white">{q}</div>
              <div className="mt-1 text-sm text-[var(--muted)]">{a}</div>
            </div>
          ))}
        </div>
      </>
    ),
  },
]

export default function Codex() {
  const [active, setActive] = useState(SECTIONS[0].id)
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    )
    Object.values(refs.current).forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const go = (id: string) => {
    refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">CODEX</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">How to play Ascend</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Everything you need to go from rookie to the endgame.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* sidebar */}
        <aside className="hidden lg:block">
          <div className="panel sticky top-24 p-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => go(s.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition ${
                  active === s.id
                    ? 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-white'
                }`}
              >
                <span>{s.icon}</span>
                {s.title}
              </button>
            ))}
          </div>
        </aside>

        {/* content */}
        <div className="space-y-5">
          {SECTIONS.map((s) => (
            <section
              key={s.id}
              id={s.id}
              ref={(el) => (refs.current[s.id] = el)}
              className="panel hud-corner scroll-mt-24 p-6"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xl">{s.icon}</span>
                <h2 className="font-pixel text-sm text-[var(--accent)] glow-text">{s.title}</h2>
              </div>
              {s.body}
            </section>
          ))}

          <div className="panel p-6 text-center">
            <Pill tone="exp">You’re ready</Pill>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Now go pick your traits and take your first quest.
            </p>
            <Link to="/app/character" className="btn btn-primary mt-4">
              ▶ Back to your character
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
