# Ascend — Accountability & Anti-Cheat Threat Model

Accountability is the product. If proof can be faked, the levels, leaderboards and real-world
rewards are worthless. So every quest is treated as an **anti-cheat problem**: for each activity we
ask *"how would a determined user fake this?"* and design the verification to close those gaps.

This document explains the design and the reasoning. The structural client-side gates are
implemented in this build; the items marked **(server)** describe how it hardens in production.

---

## Layer 0 — Structural guarantee: no file input

The single most important decision: **the app never renders an `<input type="file">`.**
The only way pixels enter a photo quest is `navigator.mediaDevices.getUserMedia()` → a frame drawn
from the live sensor to a canvas.

This makes the most common cheat — *uploading an old/saved/screenshotted photo from the camera
roll* — **structurally impossible**, not merely discouraged. There is no gallery picker to reach.

---

## Layer 1 — Liveness binding (per capture)

At the moment of capture we **burn into the image pixels**:
- a **rotating one-time liveness code** (e.g. `D74D`), issued for that session,
- a **live timestamp**, and
- **GPS coordinates** (for location quests).

Why: a replayed image, a "photo of a photo", or a screenshot of an earlier capture **will not carry
today's code**. A reviewer (or AI) can instantly see whether the burned-in token matches the one the
server issued for this attempt. **(server)** the code/nonce is issued and validated server-side and
the raw frame is never trusted from the client.

---

## Layer 2 — Per-quest verification methods

| Quest type | Method | How a cheater tries | How we stop it |
|---|---|---|---|
| Gym / run / outdoors | **Live Photo + GPS** | Photo from home; reuse old workout pic; GPS spoof | Live capture + burned code/time; GPS bound to the frame; cross-check location vs activity; impossible-travel detection; mock-location flags **(server)** |
| Generic photo proof | **Live Photo** | Gallery upload; photo of a screen | No file input; liveness code; AI screen/printout detection **(server)** |
| Deep work / focus | **Focus timer** | Start timer then scroll socials; background the app; change the clock | Page-Visibility foreground lock (leaving = interruption); **real wall-clock** timing; random "still here?" pings; interruption count logged |
| Meditation | **Stillness timer** | Walk away; background the app | Foreground lock + wall-clock + a post-session reflection gate |
| Reading | **Reading proof** | Paste a Google/ChatGPT summary; skim; mark done instantly | Minimum dwell timer; **paste blocked**; min word count; lexical-diversity heuristic; rotating comprehension question; AI plagiarism + AI-text detection **(server)** |
| Journaling | **Reflection** | Filler text; copy a previous entry | Paste blocked; min words; duplicate detection; AI-text flagging **(server)** |
| Sleep | **Sleep window** | Log "8h" at 3pm; backfill yesterday | Night check-in only 20:00–04:00; morning only 04:00–12:00; gap must be a plausible 3–14h; both timestamps live, no backfilling |

---

## Layer 3 — Account-level integrity

- **One-per-day, no backfilling.** A task can only be completed once per calendar day, and the
  completion timestamp is always "now" — you can't claim yesterday.
- **Streak validation.** Streaks only increment on a genuinely new day; gaps reset them.
- **Integrity score (0–100).** Clean verified proofs nudge it up; pending items are neutral;
  flagged/rejected proofs dock it. It's shown in the header and gates high-value reward redemptions.
- **Economy throttling.** Verified = full EXP + Aether; pending = half (awaiting review); flagged =
  zero. Cheating literally doesn't pay.

---

## Layer 4 — Human + AI review (owner side)

Anything the automated layers can't fully clear is **pending** or **flagged** and surfaces in the
**Owner Dashboard review queue** (`/app/admin`) with its full metadata (GPS, dwell time, word count,
liveness code, flag reasons, image). The owner approves or rejects; decisions feed back into the
player's integrity score. The dashboard also shows the **top flag reasons** so you can see which
cheats are trending and tune defenses.

**(server) production hardening worth adding next:**
- AI vision model for screen/printout/"photo-of-a-photo" detection and activity classification.
- EXIF / capture-pipeline attestation; device integrity (Play Integrity / App Attest).
- Server-issued nonces; all scoring server-authoritative; rate limits & anomaly detection.
- Optional peer review and trusted-buddy verification for high-stakes badges.
- Health-platform integrations (Apple Health / Google Fit / Whoop) for steps, workouts and sleep as
  corroborating signals.

---

## Design principle

Make the **honest path the easy path** and the **dishonest path more effort than just doing the
task.** Every gate above is cheaper to satisfy by genuinely doing the activity than by faking it —
which is the whole point of Ascend.
