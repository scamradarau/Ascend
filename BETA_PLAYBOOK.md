# ASCEND — Closed Beta Playbook

A 2–4 week closed beta exists to answer **two questions that no amount of code can**:

1. **Will people tolerate the verification friction?** (the core product bet)
2. **Is "verified effort" actually trustworthy, or is it gameable?** (the moat)

Everything below serves answering those two. Don't optimize anything else yet.

---

## 1. Who to recruit (and how many)

- **15–30 people.** Small enough to talk to every one of them; big enough to see a retention curve.
- **Bias toward people who already want this** — friends into fitness, reading, self-improvement, productivity. A beta is not the test of whether you can convert skeptics; it's whether the people most likely to love it actually stick.
- **Mix of devices:** at least a few iPhone users (they hit the "Add to Home Screen for notifications" path) and a few Android/desktop.
- Avoid pure favor-doers who'll sign up once to be nice and never return — they pollute your retention signal.

**Recruiting message (steal this):**
> I built a self-improvement app that works like an RPG — real quests you have to *prove* you did (photo/timer/reading checks), levels, streaks, a leaderboard. I want 20 people to use it for 2 weeks and tell me where it's annoying or broken. Free, ~2 min/day. You in?

---

## 2. What to tell testers (set expectations honestly)

- **"It's early. Things will break. That's the point — tell me when they do."** This gives you permission to ship rough and turns bugs into contributions instead of disappointments.
- **"Aim for one quest a day. Don't binge."** Daily habit is the behavior you're testing.
- **"Be honest in the app — it's built to catch fakes, and the leaderboard only means something if everyone's real."** This both tests integrity *and* recruits them into protecting it.
- **iPhone users:** walk them through **Add to Home Screen** on day 1 (Share → Add to Home Screen → open from the icon → Settings → turn on reminders). Without it they get no notifications, which kneecaps your retention test.

---

## 3. The only metrics that matter

Track these in a simple spreadsheet (one row per tester). You can read most from the owner dashboard + Supabase.

| Metric | How to read it | The threshold that means "go" |
|---|---|---|
| **D1 → first quest** | What % completed *any* quest on day 1? | **>70%.** If lower, your onboarding/first-quest friction is too high. |
| **D2 retention** | What % came back and did a quest on day 2? | **>40%.** Day 2 is where habits live or die. This is your single most important number. |
| **D7 retention** | % still active after a week | **>20%** is healthy for this category. |
| **First-photo drop-off** | Of people who hit a live-photo quest, how many bounced right there? | If there's a visible cliff at the first photo, friction is the problem — not the feature set. |
| **Verification integrity** | Spot-check the review queue + submissions. Any obvious fakes getting "verified"? | **Zero tolerated.** If the moat leaks, that's a P0. |
| **Streak survival** | How many keep a streak past 3 days? | Rising = the hook works. |

> **The decision rule:** if D2 retention is solid (>40%) and the verification holds up, you have a product — scale recruiting. If people bounce at the first photo, you have a *friction* problem to solve before any launch (not a feature gap). Don't add features to fix a friction problem.

---

## 4. How to collect feedback (low-effort, high-signal)

- **In-app:** you already have the Feedback page + Lumi. Tell testers to use it the moment something annoys them — in-the-moment beats a survey later.
- **A group chat** (Discord/WhatsApp) with all testers. The single highest-value channel — you'll see real reactions and they'll bond as a cohort (which itself boosts retention).
- **One 10-minute call** with 3–5 of them mid-beta. Watch them use it *without helping*. You'll learn more from 5 minutes of watching someone hesitate than from 50 survey responses.
- **The one survey question that matters** (Sean Ellis test), end of week 2:
  > "How would you feel if you could no longer use Ascend?" — *Very disappointed / Somewhat / Not.*
  > **>40% "very disappointed" = product-market fit signal.** Below that, keep iterating before launch.

---

## 5. Suggested timeline

- **Day 0:** Onboard the cohort personally. Get each one to complete their first quest *while you watch or chat*. (First-quest completion is the whole ballgame.)
- **Days 1–7:** Mostly observe. Fix only show-stoppers. Resist redesigning — collect signal first.
- **Day 7 check-in:** Look at D2/D7 numbers. Talk to the quiet ones (silence is data — find out why they stopped).
- **Days 8–14:** Ship fixes to the top 3 friction points. See if retention responds.
- **Day 14:** Run the Sean Ellis question. Decide: scale, iterate, or pivot.

---

## 6. Known things to watch (your current risk list)

- **Anti-cheat is advisory, not bulletproof.** The on-device AI + liveness code + GPS catch casual fakes, but a determined tester can bypass scene detection. Watch for it. If integrity is the thing people love (the "real" leaderboard), it's worth hardening server-side later.
- **Rewards are "coming soon."** Make sure testers know Aether is for cosmetics + bragging rights right now — don't let anyone grind expecting a prize that isn't wired up yet.
- **Empty social.** With <30 people the leaderboard/guild are quiet. The founding-member framing helps, but don't over-index on social engagement this round — it needs scale to come alive.
- **iOS push needs the Home Screen install.** If iPhone testers report "no notifications," that's almost always the missing install step, not a bug.

---

## The one-sentence version

**Get 20 people who want this to use it for two weeks; watch whether they come back on day 2 and whether anyone games the verification — those two answers tell you if you're ready to launch.**
