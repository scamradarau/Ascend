import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, usePlayerLevel } from '../store/useGame'
import { useAuth } from '../store/auth'
import { getAllPlayers, getAllPlayersCloud, type PlayerRow, type TraitStat } from '../store/leaderboard'
import { isCloud } from '../lib/supabase'
import { rankForLevel } from '../data/ranks'
import Icon from '../components/Icon'
import { levelFromTotalExp } from '../data/leveling'
import { traitById } from '../data/traits'
import { attributeById } from '../data/attributes'
import { REWARD_INFO } from '../data/leaderboard'
import ClassAvatar from '../components/ClassAvatar'
import { PixelTitle, Pill } from '../components/ui'

type Board = 'legendary' | 'stat' | 'quests'

const TABS: { id: Board; label: string; metric: string }[] = [
  { id: 'legendary', label: 'Legendary', metric: 'Overall level' },
  { id: 'stat', label: 'Stat', metric: 'Trait levels' },
  { id: 'quests', label: 'Quests', metric: 'Quests this month' },
]

type Ranked = PlayerRow & { pos: number; isMe: boolean }

export default function Leaderboards() {
  const navigate = useNavigate()
  const [board, setBoard] = useState<Board>('legendary')
  const authUser = useAuth((s) => s.user)
  const profile = useGame((s) => s.profile)
  const activeTraits = useGame((s) => s.activeTraits)
  const questsThisMonth = useGame((s) => s.questsThisMonth)
  const trust = useGame((s) => s.trust)
  const plus = useGame((s) => s.plus)
  const avatar = useGame((s) => s.avatar)
  const earnedBadges = useGame((s) => s.earnedBadges)
  const streak = useGame((s) => s.streak)
  const { level } = usePlayerLevel()

  // cloud rows (when the backend is configured); local otherwise
  const [cloudRows, setCloudRows] = useState<PlayerRow[] | null>(null)
  useEffect(() => {
    if (isCloud) getAllPlayersCloud().then(setCloudRows).catch(() => setCloudRows([]))
  }, [])

  const players = useMemo(() => {
    const rows = isCloud ? [...(cloudRows ?? [])] : getAllPlayers()
    if (authUser) {
      const traits: TraitStat[] = activeTraits.map((t) => {
        const def = traitById(t.id)
        return {
          id: t.id,
          name: def?.name ?? t.id,
          attribute: def?.attribute ?? 'mind',
          level: levelFromTotalExp(t.exp || 0).level,
        }
      })
      const me: PlayerRow = {
        id: authUser.id,
        username: authUser.username,
        handle: profile?.handle || authUser.username,
        level,
        statLevel: traits.reduce((m, t) => Math.max(m, t.level), 0),
        quests: questsThisMonth,
        trust,
        region: profile?.region || '-',
        age: profile?.age ?? '',
        streak,
        avatar,
        traits,
        badges: earnedBadges,
        plus,
      }
      const idx = rows.findIndex((r) => r.id === authUser.id)
      if (idx >= 0) rows[idx] = me
      else rows.push(me)
    }
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, level, questsThisMonth, trust, activeTraits, profile, avatar, earnedBadges, streak, cloudRows])

  const ranked: Ranked[] = useMemo(() => {
    const metric = (r: PlayerRow) =>
      board === 'quests' ? r.quests : board === 'stat' ? r.statLevel : r.level
    return [...players]
      .sort((a, b) => metric(b) - metric(a))
      .map((r, i) => ({ ...r, pos: i + 1, isMe: r.id === authUser?.id }))
  }, [players, board, authUser])

  // record a rank-1 finish on ANY board (sticky → feeds the Overachiever badge)
  const recordPeakBoard = useGame((s) => s.recordPeakBoard)
  useEffect(() => {
    // need at least 2 players - you can't "dominate" a ladder you're alone on
    // (otherwise a brand-new account is rank 1 by default and Overachiever
    // would award trivially).
    if (!authUser || players.length < 2) return
    ;(['legendary', 'quests', 'stat'] as Board[]).forEach((bd) => {
      const metric = (r: PlayerRow) =>
        bd === 'quests' ? r.quests : bd === 'stat' ? r.statLevel : r.level
      const sorted = [...players].sort((a, b) => metric(b) - metric(a))
      const top = sorted[0]
      const runnerUp = sorted[1]
      // must be #1, with a positive score, and actually ahead of someone else
      if (top && top.id === authUser.id && metric(top) > 0 && metric(top) > metric(runnerUp))
        recordPeakBoard(bd)
    })
  }, [players, authUser, recordPeakBoard])

  const info = REWARD_INFO[board]
  const empty = ranked.length === 0
  // a board with only a handful of climbers reads as exclusive, not dead -
  // frame it as founding-member early access (self-hides once it fills out).
  const founding = ranked.length > 0 && ranked.length <= 12
  const podium = ranked.slice(0, 3)
  // deck-style order: 2nd, 1st, 3rd
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean) as Ranked[]
  const value = (e: Ranked) => (board === 'quests' ? e.quests : board === 'stat' ? e.statLevel : e.level)

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">LEADERBOARDS</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Climb the ladder</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Three boards, ranking real players. Tap any player to view their build.
        </p>
      </div>

      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setBoard(t.id)}
            className={`flex-1 rounded-lg border px-4 py-3 text-center transition ${
              board === t.id
                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] shadow-glow'
                : 'border-white/8 hover:border-white/25'
            }`}
          >
            <div className="font-display text-sm font-bold uppercase tracking-wide text-white">{t.label}</div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{t.metric}</div>
          </button>
        ))}
      </div>

      {founding && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-cosmos-gold/30 bg-gradient-to-r from-cosmos-gold/10 to-transparent p-4">
          <span className="text-2xl">🌱</span>
          <div>
            <div className="font-display text-sm font-bold text-white">You’re a founding Ascender</div>
            <p className="text-xs text-[var(--muted)]">
              The ladder is brand new - every name here is one of the very first. Climb now and you’re
              the rank everyone who comes later has to chase.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- PODIUM (class-portrait heads) ---------------- */}
      {!empty && (
        <div className="panel mb-5 grid grid-cols-3 items-end gap-1 p-3 sm:gap-6 sm:p-5">
          {podiumOrder.map((e) => {
            const isFirst = e.pos === 1
            return (
              <button
                key={e.id}
                onClick={() => navigate(`/app/player/${e.id}`)}
                className={`group flex flex-col items-center ${isFirst ? '-mt-4' : ''}`}
              >
                <div
                  className={`relative ${isFirst ? 'scale-110' : 'opacity-95'} transition group-hover:scale-[1.15]`}
                >
                  <ClassAvatar level={e.level} config={e.avatar} size={isFirst ? 120 : 92} animated={false} />
                  <div
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border px-2 py-0.5 font-pixel text-[10px] ${
                      e.pos === 1
                        ? 'border-cosmos-gold bg-black/70 text-cosmos-gold'
                        : 'border-[var(--edge)] bg-black/70 text-[var(--accent)]'
                    }`}
                  >
                    {e.pos === 1 ? '👑 1' : e.pos}
                  </div>
                </div>
                <div className="mt-3 font-display text-sm font-bold text-white">{e.handle}</div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  {rankForLevel(e.level).title}
                </div>
                <div className="font-pixel text-xs text-[var(--accent)]">
                  {board === 'quests' ? `${e.quests} q` : `Lv${value(e)}`}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="panel hud-corner overflow-hidden">
          <div className="grid grid-cols-[44px_1fr_auto] gap-3 border-b border-white/8 px-5 py-3 text-[10px] uppercase tracking-widest text-[var(--muted)]">
            <span>#</span>
            <span>Player</span>
            <span>{board === 'quests' ? 'Quests' : board === 'stat' ? 'Top' : 'Level'}</span>
          </div>

          {empty ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <span className="text-4xl">🏔️</span>
              <p className="font-display text-lg font-bold text-white">The ladder is wide open</p>
              <p className="max-w-sm text-sm text-[var(--muted)]">
                No one has climbed yet. Complete verified quests to claim the founder’s spot.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {ranked.map((e) => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/app/player/${e.id}`)}
                  className={`grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 px-5 py-3 text-left transition hover:bg-white/[0.03] ${
                    e.isMe ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]' : ''
                  }`}
                >
                  <span
                    className={`font-pixel text-sm ${
                      e.pos === 1 ? 'text-cosmos-gold' : e.pos <= 3 ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                    }`}
                  >
                    {e.pos}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      <ClassAvatar level={e.level} config={e.avatar} size={40} animated={false} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-display font-bold text-white">
                        {e.handle}
                        {e.plus && (
                          <span className="text-cosmos-gold" title="Ascend Plus member">
                            <Icon name="plus" />
                          </span>
                        )}
                        {e.isMe && <Pill tone="exp">You</Pill>}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                        {rankForLevel(e.level).title} · {e.region} ·{' '}
                        <span
                          title="Integrity - anti-cheat trust score"
                          className={
                            e.trust >= 80
                              ? 'text-exp'
                              : e.trust >= 50
                                ? 'text-amber-300'
                                : 'text-cosmos-magenta'
                          }
                        >
                          <Icon name="integrity" /> {e.trust}
                        </span>
                        {e.streak > 0 && (
                          <span className="text-amber-300" title={`${e.streak}-day streak`}>
                            {' '}
                            · <Icon name="streak" /> {e.streak}
                          </span>
                        )}
                      </div>
                      {/* STAT board: show individual trait levels */}
                      {board === 'stat' && e.traits.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {e.traits.map((t) => {
                            const attr = attributeById(t.attribute as any)
                            return (
                              <span
                                key={t.id}
                                className="inline-flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
                              >
                                <span style={{ color: attr.color }}>{attr.icon}</span>
                                {t.name} <span className="text-[var(--accent)]">Lv{t.level}</span>
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-pixel text-sm text-[var(--accent)]">
                    {board === 'quests' ? e.quests : `Lv${board === 'stat' ? e.statLevel : e.level}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel hud-corner p-5">
            <span className="font-pixel text-xs text-cosmos-gold">{info.title}</span>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{info.body}</p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="uppercase tracking-widest text-[var(--muted)]">Rotation</span>
              <Pill tone="gold">{info.rotation}</Pill>
            </div>
          </div>
          <div className="panel p-5 text-center">
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">Rewards · coming soon</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {[
                ['🧘', 'Free Memberships'],
                ['📚', 'Ebooks'],
                ['🏷️', 'Discount Codes'],
                ['✨', 'Cosmetics'],
                ['📣', 'Shout-outs'],
                ['🎖️', 'Digital Badges'],
              ].map(([icon, label]) => (
                <div key={label} className="rounded-lg border border-white/8 bg-white/[0.02] p-2">
                  <div className="text-xl">{icon}</div>
                  <div className="text-[10px] text-[var(--muted)]">{label}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-[var(--muted)]">
              A preview of what climbing will earn. These perks unlock as we onboard sponsors -
              Aether and bragging rights are live now.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
