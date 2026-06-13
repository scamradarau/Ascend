import { supabase, isOwnerEmail, fetchEarnedProgress } from '../lib/supabase'
import { useAuth } from './auth'
import { useGame, type Submission } from './useGame'
import { useSocial } from './social'
import { todayKey } from '../lib/time'
import type { VerificationResult } from '../data/verification'

// ================================================================
// SERVER VERIFY (Move 1) — routes a quest completion through the
// server-authoritative Edge Functions instead of computing EXP on the
// client:
//   1. issue-liveness-code  → single-use server nonce
//   2. verify-submission    → server decides status + EXP, writes profiles
//   3. reconcile EXP/trust/streak/trait levels back from `profiles`
//   4. update local UI-only state (journal entry, dailyLog, aether, main progress)
//
// Currently gated to the owner account in Quests.tsx so live testers stay
// on the stable local path until the RLS lockdown (Move 2) lands.
// ================================================================

async function reconcileEarned(userId: string) {
  // owner test-mode: don't roll back "set level" experiments
  if (useGame.getState().ownerMode && isOwnerEmail(useAuth.getState().user?.email)) return
  const prog = await fetchEarnedProgress(userId)
  if (!prog) return
  useGame.setState((s) => {
    const newTotal = typeof prog.total_exp === 'number' ? prog.total_exp : s.totalExp
    // Aether shadows EXP at 1:4 — granted once per server EXP delta
    const delta = newTotal - s.totalExp
    return {
      totalExp: newTotal,
      aether: delta > 0 ? s.aether + Math.round(delta / 4) : s.aether,
      trust: typeof prog.trust === 'number' ? prog.trust : s.trust,
      // streak is client-owned (so Streak Freeze works) — do NOT sync it down
      questsThisMonth:
        typeof prog.quests_this_month === 'number' ? prog.quests_this_month : s.questsThisMonth,
      earnedBadges: Array.isArray(prog.earned_badges) ? prog.earned_badges : s.earnedBadges,
      activeTraits:
        prog.trait_exp && Object.keys(prog.trait_exp).length
          ? s.activeTraits.map((t) =>
              prog.trait_exp![t.id] != null ? { ...t, exp: prog.trait_exp![t.id] } : t,
            )
          : s.activeTraits,
    }
  })
}

export interface ServerSubmitArgs {
  questId: string
  method: Submission['method']
  label: string
  kind: 'daily' | 'main' | 'challenge'
  traitId?: string
  taskId?: string
  result: VerificationResult
}

export interface ServerSubmitResult {
  status: 'verified' | 'pending' | 'flagged'
  exp: number
  mainDone?: boolean
  /** server refused the submission (e.g. already logged today) — show this */
  error?: string
}

// Full self-service wipe — clears the SERVER's earned state (profiles,
// quest_progress, submissions) so "Reset all progress" isn't rolled back by
// the next earned-values sync. Server function only ever touches the caller.
export async function serverResetProgress(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: true } // offline: nothing server-side to clear
  const res = await supabase.functions.invoke('reset-progress', { body: {} })
  const data = (res.data as { ok?: boolean; error?: string } | null) ?? {}
  if (res.error || data.error) return { ok: false, error: data.error ?? res.error?.message }
  // drop cached submissions so review states/alerts clear immediately
  useSocial.setState({ submissions: [] })
  return { ok: true }
}

// Reset a main quest's server-side progress (only allowed while unfinished —
// the Edge Function refuses completed quests so EXP can't be farmed).
export async function resetQuestProgress(questId: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: true } // offline: nothing server-side to clear
  const res = await supabase.functions.invoke('reset-quest', { body: { quest_id: questId } })
  const data = (res.data as { ok?: boolean; error?: string } | null) ?? {}
  if (res.error || data.error) return { ok: false, error: data.error ?? res.error?.message }
  // pull authoritative values back (progress reset doesn't change EXP, but keep in sync)
  const userId = useAuth.getState().user?.id
  if (userId) await reconcileEarned(userId)
  return { ok: Boolean(data.ok) }
}

export async function serverSubmitQuest(a: ServerSubmitArgs): Promise<ServerSubmitResult> {
  const userId = useAuth.getState().user?.id
  if (!supabase || !userId) return { status: 'pending', exp: 0 }

  // 1. server-issued single-use liveness nonce
  const issued = await supabase.functions.invoke('issue-liveness-code', {
    body: { quest_id: a.questId },
  })
  const code = (issued.data as { code?: string } | null)?.code

  // 2. server decides status + EXP and writes profiles via service role
  const verify = await supabase.functions.invoke('verify-submission', {
    body: {
      quest_id: a.questId,
      method: a.method,
      label: a.label,
      liveness_code: code,
      captured_at: a.result.meta?.capturedAt ?? new Date().toISOString(),
      gps: a.result.meta?.gps ?? null,
      thumb: a.result.thumb ?? null,
      // the client's on-device verdict caps the server result (no upgrades)
      client_status: a.result.status,
      // hybrid auto-approve: true only when the on-device AI actually
      // CONFIRMED the scene (so a clear gym/meal/outdoors photo skips review)
      scene_pass: a.result.meta?.sceneChecked === true && a.result.meta?.sceneVerdict === 'verified',
    },
  })
  const res =
    (verify.data as {
      status?: string
      exp_awarded?: number
      main_done?: boolean
      error?: string
    } | null) ?? {}
  // server refusal (e.g. "already logged today") — surface it, change nothing
  if (res.error) return { status: 'flagged', exp: 0, error: res.error }
  const status = (res.status as ServerSubmitResult['status']) ?? 'pending'
  const exp = res.exp_awarded ?? 0
  const verified = status === 'verified'

  // 3. pull authoritative EXP/trust/streak/trait levels back from profiles
  await reconcileEarned(userId)

  // 4. local UI-only state (journal entry always; "done" + rewards only on a
  //    real verify — a pending photo stays NOT-done until an admin approves it)
  let registerStreak = false
  useGame.setState((s) => {
    const at = new Date().toISOString()
    const sub: Submission = {
      id: `${a.questId}:${at}`,
      traitId: a.traitId ?? '',
      taskId: a.taskId ?? a.questId,
      kind: a.kind === 'main' ? 'main' : 'daily',
      label: a.label,
      method: a.method,
      status,
      note: a.result.note,
      meta: a.result.meta,
      thumb: a.result.thumb,
      at,
    }
    const patch: Partial<ReturnType<typeof useGame.getState>> = {
      submissions: [sub, ...s.submissions].slice(0, 120),
    }
    if (verified) {
      // (aether is granted by reconcileEarned from the server EXP delta)
      if (a.kind === 'daily' && a.traitId && a.taskId) {
        patch.dailyLog = { ...s.dailyLog, [`${a.traitId}:${a.taskId}:${todayKey()}`]: at }
        registerStreak = true
      }
      if (a.kind === 'main' && a.traitId) {
        const step = a.questId.startsWith('main-practical:') ? 1 / 14 : 0.25
        patch.activeTraits = s.activeTraits.map((t) =>
          t.id === a.traitId
            ? {
                ...t,
                mainQuestProgress: Math.min(1, t.mainQuestProgress + step),
                mainQuestDone: Boolean(res.main_done),
              }
            : t,
        )
        if (res.main_done) {
          patch.completedQuests = [{ traitId: a.traitId, title: a.label, at }, ...s.completedQuests]
        }
      }
    }
    return patch
  })

  // streak is client-owned — advance it once per day on a verified daily
  if (registerStreak) useGame.getState().registerCloudCheckIn()

  // refresh social so the quest's review state (pending/verified) + alerts update
  void useSocial.getState().refresh()

  return { status, exp, mainDone: Boolean(res.main_done) }
}
