import { supabase, fetchEarnedProgress } from '../lib/supabase'
import { useAuth } from './auth'
import { useGame, type Submission } from './useGame'
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
  const prog = await fetchEarnedProgress(userId)
  if (!prog) return
  useGame.setState((s) => ({
    totalExp: typeof prog.total_exp === 'number' ? prog.total_exp : s.totalExp,
    trust: typeof prog.trust === 'number' ? prog.trust : s.trust,
    streak: typeof prog.streak === 'number' ? prog.streak : s.streak,
    questsThisMonth:
      typeof prog.quests_this_month === 'number' ? prog.quests_this_month : s.questsThisMonth,
    earnedBadges: Array.isArray(prog.earned_badges) ? prog.earned_badges : s.earnedBadges,
    activeTraits:
      prog.trait_exp && Object.keys(prog.trait_exp).length
        ? s.activeTraits.map((t) =>
            prog.trait_exp![t.id] != null ? { ...t, exp: prog.trait_exp![t.id] } : t,
          )
        : s.activeTraits,
  }))
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
    },
  })
  const res = (verify.data as { status?: string; exp_awarded?: number; main_done?: boolean } | null) ?? {}
  const status = (res.status as ServerSubmitResult['status']) ?? 'pending'
  const exp = res.exp_awarded ?? 0

  // 3. pull authoritative EXP/trust/streak/trait levels back from profiles
  await reconcileEarned(userId)

  // 4. local UI-only state (journal, dailyLog, aether, main progress)
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
      aether: s.aether + Math.round(exp / 4),
      submissions: [sub, ...s.submissions].slice(0, 120),
    }
    if (a.kind === 'daily' && a.traitId && a.taskId) {
      patch.dailyLog = { ...s.dailyLog, [`${a.traitId}:${a.taskId}:${todayKey()}`]: at }
    }
    if (a.kind === 'main' && a.traitId) {
      patch.activeTraits = s.activeTraits.map((t) =>
        t.id === a.traitId
          ? {
              ...t,
              mainQuestProgress: Math.min(1, t.mainQuestProgress + 0.25),
              mainQuestDone: Boolean(res.main_done),
            }
          : t,
      )
      if (res.main_done) {
        patch.completedQuests = [{ traitId: a.traitId, title: a.label, at }, ...s.completedQuests]
      }
    }
    return patch
  })

  return { status, exp }
}
