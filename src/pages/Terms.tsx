import { Link } from 'react-router-dom'
import { PixelTitle } from '../components/ui'

const TERMS: { title: string; body: string[] }[] = [
  {
    title: '1. What Ascend is (and isn’t)',
    body: [
      'Ascend is a gamified self-improvement platform. Levels, ranks and “life expectations” are for motivation and entertainment - they are not professional advice.',
      'Nothing in Ascend is medical, financial, legal or psychological advice. Consult a qualified professional before making decisions about your health, money or wellbeing.',
      'Train within your limits. You are responsible for exercising safely and for any activity you choose to do for a quest.',
    ],
  },
  {
    title: '2. Eligibility & your account',
    body: [
      'You must be at least 13 years old to use Ascend.',
      'One account per person. Your account is yours alone - don’t share credentials or let others submit proof as you.',
      'You’re responsible for what happens on your account. Keep your password safe.',
    ],
  },
  {
    title: '3. Fair play - the one rule that matters',
    body: [
      'The honest path is the only path. Every level on the ladder must be earned with real, verified effort.',
      'Do not fake, stage, replay or manipulate quest proof; do not tamper with the client, the API, or other players’ data.',
      'Cheating consequences scale: flagged submissions earn nothing and reduce your Integrity score; repeated or egregious cheating leads to progress resets or account termination. Verified players climbing honestly are who this platform is for.',
    ],
  },
  {
    title: '4. Community guidelines',
    body: [
      'Respect the climb: no harassment, hate speech, slurs, threats or bullying - in handles, chat, messages or photos.',
      'Keep it safe-for-work: no sexual, violent, shocking or illegal content anywhere, including quest photos.',
      'No spam, scams, advertising or self-promotion in the Guild or DMs.',
      'Handles must be appropriate; offensive handles are filtered at creation and can be force-renamed by moderators.',
      'See something? Use the ⚐ Report button on profiles, guild messages and DMs. Reports go straight to the moderation team.',
    ],
  },
  {
    title: '5. Your content & proof',
    body: [
      'You own the photos and writing you submit. By submitting them you grant Ascend a limited licence to store and review them solely to verify your progress and keep the game fair.',
      'Quest proof is private - it is never shown on your public profile or the leaderboards. See the Privacy & Confidentiality policy for details.',
      'Submit only content you have the right to share, and never include other people who haven’t agreed to appear.',
    ],
  },
  {
    title: '6. Virtual items & rewards',
    body: [
      'EXP, Aether, badges, cosmetics and ranks are virtual. They have no cash value and can’t be sold, traded or transferred.',
      'Real-world rewards (when offered) are limited, subject to availability and verification, and may change between seasons.',
      'We may rebalance the economy (EXP values, prices, targets) to keep the game fair. We’ll aim to do so transparently.',
    ],
  },
  {
    title: '7. Moderation & enforcement',
    body: [
      'We may remove content, rename handles, suspend features, reset fraudulent progress, or terminate accounts that break these terms.',
      'We aim to warn first for minor issues; severe violations (hate speech, cheating rings, endangering others) may result in immediate termination.',
      'You can appeal any enforcement decision via the Feedback page.',
    ],
  },
  {
    title: '8. Service & liability',
    body: [
      'Ascend is provided “as is”. We work hard on uptime and data integrity, but we can’t guarantee uninterrupted service or that progress will never need to be restored.',
      'To the maximum extent permitted by law, Ascend’s liability is limited to the amount you’ve paid us in the past 12 months (currently: nothing - the platform is free during launch).',
      'We may update these terms as the platform evolves. Material changes will be announced in-app; continuing to play means you accept the updated terms.',
    ],
  },
]

export default function Terms() {
  return (
    <div className="cosmos-bg starfield relative min-h-screen px-6 py-16">
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <Link to="/" className="text-xs uppercase tracking-widest text-[var(--muted)] hover:text-white">
          ← Back
        </Link>
        <div className="mt-4">
          <PixelTitle className="text-sm text-cosmos-cyan">TERMS &amp; COMMUNITY GUIDELINES</PixelTitle>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">
            The rules of the realm
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Short version: be honest, be decent, prove your work. The long version below exists so
            everyone climbs the same ladder. Last updated: June 2026.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {TERMS.map((s) => (
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
          These terms are a plain-language version for the Ascend launch and are not legal advice.
          They would be reviewed by counsel as the platform grows. See also the{' '}
          <Link to="/privacy" className="text-[var(--accent)] underline">
            Privacy &amp; Confidentiality
          </Link>{' '}
          policy.
        </div>
      </div>
    </div>
  )
}
