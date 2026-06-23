import { BADGES } from './badges'
import { TRAITS } from './traits'
import { levelFromTotalExp } from './leveling'
import type { Badge } from './types'

// ================================================================
// BADGE ENGINE - turns each badge requirement's `metric` into a live
// value computed from game state, so progress fills and badges award
// themselves. Pure: takes a snapshot, no store import (avoids a cycle).
// ================================================================

export interface BadgeSnapshot {
  streak: number
  bestStreak: number
  lifetimeQuests: number
  completedQuests: { traitId: string }[]
  totalExp: number
  activeTraits: { id: string; exp: number }[]
  archivedTraits: Record<string, { exp: number }>
  peakBoards: string[]
  onboarded: boolean
}

function traitExpOf(g: BadgeSnapshot, id: string): number {
  const active = g.activeTraits.find((t) => t.id === id)
  if (active) return active.exp
  return g.archivedTraits[id]?.exp ?? 0
}

function traitLevelOf(g: BadgeSnapshot, id: string): number {
  return levelFromTotalExp(traitExpOf(g, id)).level
}

function attrMaxLevel(g: BadgeSnapshot, attr: string): number {
  let max = 0
  for (const t of TRAITS) {
    if (t.attribute !== attr) continue
    const lvl = traitLevelOf(g, t.id)
    if (lvl > max) max = lvl
  }
  return max
}

/** Current value of a badge metric for this snapshot. */
export function metricValue(metric: string, g: BadgeSnapshot): number {
  if (metric === 'bestStreak') return Math.max(g.bestStreak, g.streak)
  if (metric === 'lifetimeQuests') return g.lifetimeQuests
  if (metric === 'completedMains') return g.completedQuests.length
  if (metric === 'playerLevel') return levelFromTotalExp(g.totalExp).level
  if (metric === 'onboarded') return g.onboarded ? 1 : 0
  if (metric.startsWith('traitLevel:')) return traitLevelOf(g, metric.slice('traitLevel:'.length))
  if (metric.startsWith('attrTraitLevel:'))
    return attrMaxLevel(g, metric.slice('attrTraitLevel:'.length))
  if (metric.startsWith('rank1:'))
    return g.peakBoards.includes(metric.slice('rank1:'.length)) ? 1 : 0
  return 0
}

export interface BadgeProgress {
  reqs: { label: string; total: number; metric: string; done: number; met: boolean }[]
  done: number
  total: number
  pct: number
  earned: boolean
}

export function badgeProgress(badge: Badge, g: BadgeSnapshot): BadgeProgress {
  const reqs = badge.requirements.map((r) => {
    const done = Math.min(metricValue(r.metric, g), r.total)
    return { ...r, done, met: done >= r.total }
  })
  const done = reqs.reduce((s, r) => s + r.done, 0)
  const total = reqs.reduce((s, r) => s + r.total, 0)
  return {
    reqs,
    done,
    total,
    pct: total ? Math.round((done / total) * 100) : 0,
    earned: reqs.every((r) => r.met),
  }
}

/** Ids of every badge whose requirements are all met for this snapshot. */
export function earnedBadgeIds(g: BadgeSnapshot): string[] {
  return BADGES.filter((b) => badgeProgress(b, g).earned).map((b) => b.id)
}
