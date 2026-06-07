import { Link } from 'react-router-dom'
import { PixelTitle } from '../components/ui'

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. What we collect',
    body: [
      'Account details: your username and a securely hashed password (we never store your password in plain text — it is hashed with PBKDF2-SHA256 and a unique salt).',
      'Profile & progress: your handle, age range, region, chosen traits, levels, EXP, streaks, badges and avatar.',
      'Accountability evidence: the photos, written summaries, reflections, timers and location data you submit to verify quests.',
    ],
  },
  {
    title: '2. How we use it',
    body: [
      'To run the game — track your progression, power the leaderboards, and award EXP, items and rewards.',
      'To keep the game fair — verify your quest completions and detect fabricated or low-effort submissions.',
      'To improve Ascend — understand which traits and quests help people most (in aggregate, never to single you out).',
    ],
  },
  {
    title: '3. Your evidence is treated as confidential',
    body: [
      'Accountability photos and written check-ins are private to you and the small review team that verifies flagged submissions. They are NOT shown publicly on your profile or the leaderboards.',
      'Real-time photos are used only to confirm an activity happened. We do not sell, license, or publish your images.',
      'High-level proof (income, business, physique documents) is reviewed strictly for verification and is access-restricted.',
    ],
  },
  {
    title: '4. What other players can see',
    body: [
      'Your public profile shows only: your handle, rank, level, trait levels, badges, region, streak and avatar.',
      'Your photos, summaries, reflections, raw GPS coordinates and integrity details are never visible to other players.',
      'You control your friends list. You can remove a friend at any time.',
    ],
  },
  {
    title: '5. Location data',
    body: [
      'Location is captured only at the moment you submit a location-based quest (e.g. a gym check-in), and only to confirm the activity is plausible.',
      'We store an approximate coordinate with the submission for review — we do not track your location in the background, ever.',
    ],
  },
  {
    title: '6. Data security & retention',
    body: [
      'Passwords are hashed; sensitive evidence is access-controlled and retained only as long as needed to verify and audit progress.',
      'You can delete your account and wipe your data at any time from Settings → Reset all progress.',
      'In this build, your data is stored locally on your own device. A hosted version would store it on secured servers with encryption in transit and at rest.',
    ],
  },
  {
    title: '7. Your rights',
    body: [
      'Access, export or delete your data on request.',
      'Withdraw consent for photo/document verification (note: some high-level features require it to remain fair).',
      'Contact us at privacy@ascend.game for any request.',
    ],
  },
]

export default function Privacy() {
  return (
    <div className="cosmos-bg starfield relative min-h-screen px-6 py-16">
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <Link to="/" className="text-xs uppercase tracking-widest text-[var(--muted)] hover:text-white">
          ← Back
        </Link>
        <div className="mt-4">
          <PixelTitle className="text-sm text-cosmos-cyan">PRIVACY &amp; CONFIDENTIALITY</PixelTitle>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">
            Your progress is yours. Your proof is private.
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Ascend runs on trust — yours in us, and ours in your submissions. Here’s exactly what we
            collect, how we use it, and what stays confidential. Last updated: 2026.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {SECTIONS.map((s) => (
            <div key={s.title} className="panel hud-corner p-5">
              <h2 className="font-display text-lg font-bold text-white">{s.title}</h2>
              <ul className="mt-3 space-y-2">
                {s.body.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                    <span className="text-cosmos-cyan">▹</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-slate-500">
          This policy is a plain-language summary for the Ascend prototype. It is not legal advice and
          would be reviewed by counsel before a public launch.
        </div>
      </div>
    </div>
  )
}
