# ASCEND

**Treating self improvement as game progression. Let's get you to the endgame.**

A gamified self-improvement platform built from the Ascend concept deck. Treat real-life
self-mastery like RPG character progression: traits are stats, books & habits are quests,
levels set life expectations, and leaderboards / badges / a guild keep you accountable.

---

## Quick start

```bash
cd app
npm install      # first time only
npm run dev      # start the dev server → http://localhost:5173
```

Production build:

```bash
npm run build    # type-checks then bundles to app/dist
npm run preview  # serve the production build locally
```

> Requires Node 18+ (built & tested on Node 24).

---

## Accounts

- **Sign up / log in** with a username + password. Passwords are hashed client-side with
  **PBKDF2-SHA256 + per-user salt** (Web Crypto). Each account has its own private save.
- ⚠️ **Production note:** real cross-device login needs a backend (API + DB + tokens). The auth
  logic is isolated in `src/store/auth.ts` — swap those four functions for `fetch()` calls to your
  server and nothing else changes. Today everything persists per-account in `localStorage`.

## The flow

1. **Landing** (`/`) → *Let's get started* → **Sign up** (`/signup`) or **Log in** (`/login`).
2. **Disclaimers** (`/disclaimers`) — consent forms (real-time photos, document proof, T&Cs).
3. **Onboarding** (`/onboarding`) — a **7-step** questionnaire (identity → self-assessment →
   goals & outcomes → obstacles → lifestyle → commitment/tier → your build). The engine **computes
   your starting level & rank** and **suggests your first 3 traits/quests**, tuned to your chosen
   outcomes, the obstacles you want to beat, and your daily time commitment.
4. **The platform** (`/app/*`):
   - **Character** — the most-used page. Stats on the left, a glowing body figure in the
     middle (click the brain to discover traits), daily quests on the right with
     evidence-prompt check-ins.
   - **Trait Matrix** — browse **40+ traits** grouped by attribute. Build only **3 at a time**.
     Each trait page has a **Mastery Track** (Initiate → Grandmaster milestones).
   - **Codex** — a full in-app user guide: philosophy, stats/levels, the rule of 3, verification,
     ranks, economy, badges, leaderboards, strategy and FAQ.
   - **Trait / Library** — description, how-to-level, daily tasks, the main-quest book +
     "why", and hot tips (e.g. the deck's *Focus → Eat That Frog!* example).
   - **Quests** — in-progress quests, main-quest progress, plus **Weekly & Monthly Challenges**
     (longer, harder, much bigger EXP/Aether; reset each period). Reading quests let you **choose
     your book** and link out to buy it or read/borrow it free.
   - **Leaderboards** — three boards built **live from registered accounts** (empty at launch).
   - **Level & Expectations** — rank ladder (Rookie → Ascendant) with the life expectations
     each rank sets (income, physique, business…).
   - **Leaderboards** — Legendary / Stat / Quests boards + rotating real-world reward info.
   - **Inventory** — Badges, Items (cosmetics) and your proof log.
   - **Guild** — one-server community chat.
   - **Feedback** — community roadmap & trait suggestions.
   - **Settings** — switch **Cosmos** (sci-fi) vs **Rune** (MMO) themes, cycle your helmet,
     toggle soundtrack, re-run onboarding, reset progress.

Progress saves to `localStorage` (`ascend-save-v1`). No account required for this build.

---

## Accountability & anti-cheat (the core)

Every quest routes through a **verification method** designed around "how would someone fake
this?". Methods live in `src/data/verification.ts` (each documents its cheat vectors + defenses),
and the UI is in `src/components/verifiers/`:

- **Live Photo / Live Photo + GPS** (`LiveCamera.tsx`) — real `getUserMedia` capture. There is
  **no `<input type=file>` anywhere**, so gallery/screenshot uploads are structurally impossible.
  A rotating liveness code + live timestamp (+ GPS) are **burned into the image pixels** at capture.
- **Focus / Stillness timers** (`TimerVerifier.tsx`) — wall-clock timing (clock changes don't help)
  + **Page Visibility foreground lock** (leaving the app = interruption) + random presence pings.
- **Reading proof** (`ReadingVerifier.tsx`) — minimum dwell timer, **paste blocked**, min word count,
  lexical-diversity heuristic, and a rotating comprehension question.
- **Reflection / Sleep window** — typed-only journaling; sleep needs live night + morning check-ins
  in real time windows (no backfilling).

Submissions carry a **status** (`verified` / `pending` / `flagged`) and adjust your **Integrity
score** (header). Flagged/pending items land in the **Owner review queue** (`/app/admin`).
See `ACCOUNTABILITY.md` for the full threat model.

## Avatars, economy & owner tools

- **Avatar Forge** (`src/components/Avatar.tsx`, `src/data/cosmetics.ts`) — layered SVG bust with 10
  helmet tiers, auras, frames and energy cores, unlocked by level / badges / streaks / Aether.
- **Aether (◈)** currency earned on verified quests → **Shop** (`/app/shop`) for cosmetics and
  sponsor-funded real-world rewards.
- **Seasons** (`src/data/seasons.ts`) — a rotating battle-pass of tiered rewards.
- **Owner Dashboard** (`/app/admin`, toggle in Settings) — KPIs, the verification review queue,
  flag-reason analytics, revenue and reward/sponsor management.

## Tech

- **React 18 + TypeScript + Vite**
- **TailwindCSS** with two themed design systems (Cosmos / Rune) via CSS variables
- **Zustand** (persisted) for game state, EXP/level math, streaks & evidence log
- **React Router** (hash routing) with an onboarding gate

## Where to adjust things

| Want to change…                | Edit…                                  |
| ------------------------------ | -------------------------------------- |
| Traits / quests / books / tips | `src/data/traits.ts`                   |
| Attributes (stat groups)       | `src/data/attributes.ts`               |
| Ranks & life expectations      | `src/data/ranks.ts`                    |
| Badges                         | `src/data/badges.ts`                   |
| Leaderboard cast & rewards     | `src/data/leaderboard.ts`              |
| Onboarding questions & scoring | `src/data/onboarding.ts`               |
| EXP curve                      | `src/data/leveling.ts`                 |
| Theme colours / fonts          | `tailwind.config.js`, `src/styles/index.css` |
| Game state & rules             | `src/store/useGame.ts`                 |

> The "3 traits at a time" rule, tier level-caps (Low 20 / Mid 40 / High 60), evidence
> requirements and the rank → life-expectations mapping all come straight from the deck.
