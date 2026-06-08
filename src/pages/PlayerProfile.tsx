import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { useAuth } from '../store/auth'
import { getPlayer, getPlayerCloud, type PlayerRow } from '../store/leaderboard'
import { isCloud } from '../lib/supabase'
import { rankForLevel } from '../data/ranks'
import { attributeById } from '../data/attributes'
import { BADGES } from '../data/badges'
import { classForLevel } from '../data/classes'
import ClassAvatar from '../components/ClassAvatar'
import { PixelTitle, Pill, ExpBar } from '../components/ui'

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const authUser = useAuth((s) => s.user)
  const friends = useGame((s) => s.friends)
  const addFriend = useGame((s) => s.addFriend)
  const removeFriend = useGame((s) => s.removeFriend)

  const [cloudP, setCloudP] = useState<PlayerRow | null | undefined>(isCloud ? undefined : null)
  useEffect(() => {
    if (isCloud && id) getPlayerCloud(id).then(setCloudP).catch(() => setCloudP(null))
  }, [id])

  const p = isCloud ? cloudP ?? null : id ? getPlayer(id) : null

  if (isCloud && cloudP === undefined) {
    return <div className="panel p-10 text-center text-[var(--muted)]">Loading profile…</div>
  }
  if (!p) {
    return (
      <div className="panel p-10 text-center">
        <p className="text-[var(--muted)]">This player hasn’t started their ascent yet.</p>
        <button onClick={() => navigate('/app/leaderboards')} className="btn btn-ghost mt-4">
          ← Back to leaderboards
        </button>
      </div>
    )
  }

  const isSelf = authUser?.id === p.id
  const isFriend = friends.includes(p.id)
  const rank = rankForLevel(p.level)
  const cls = classForLevel(p.level)
  const earned = BADGES.filter((b) => p.badges.includes(b.id))

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-xs uppercase tracking-widest text-[var(--muted)] hover:text-white"
      >
        ← Back
      </button>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* ---- identity card ---- */}
        <div className="panel hud-corner p-6 text-center">
          <div className="flex justify-center">
            <ClassAvatar level={p.level} config={p.avatar} size={200} />
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-widest text-[var(--accent)]">
            {cls.name}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">{p.handle}</h1>
          <div className="mt-1 font-pixel text-sm text-[var(--accent)] glow-text">
            {rank.title} · Lv {p.level}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Pill>{p.region}</Pill>
            <Pill tone="exp">🔥 {p.streak}d streak</Pill>
            <Pill tone={p.trust >= 80 ? 'exp' : 'default'}>Integrity {p.trust}</Pill>
          </div>

          {!isSelf && (
            <button
              onClick={() => (isFriend ? removeFriend(p.id) : addFriend(p.id))}
              className={`mt-5 w-full text-sm ${isFriend ? 'btn btn-ghost' : 'btn btn-primary'}`}
            >
              {isFriend ? '✓ Friends — remove' : '+ Add friend'}
            </button>
          )}
          {isSelf && <Pill tone="violet">This is you</Pill>}
          {p.memberSince && (
            <p className="mt-3 text-[10px] uppercase tracking-widest text-[var(--muted)]">
              Member since {new Date(p.memberSince).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* ---- stats ---- */}
        <div className="space-y-5">
          <div className="panel p-5">
            <PixelTitle className="text-xs text-[var(--accent)]">TRAITS IN PROGRESS</PixelTitle>
            <div className="mt-4 space-y-3">
              {p.traits.length === 0 && (
                <p className="text-sm text-[var(--muted)]">No traits in progress.</p>
              )}
              {p.traits.map((t) => {
                const attr = attributeById(t.attribute as any)
                return (
                  <div key={t.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-display font-bold uppercase tracking-wide text-white">
                        <span style={{ color: attr.color }}>{attr.icon}</span> {t.name}
                      </span>
                      <span className="font-pixel text-[11px] text-[var(--accent)]">Lv {t.level}</span>
                    </div>
                    <div className="mt-2">
                      <ExpBar pct={Math.min(100, (t.level % 10) * 10 + 12)} height="h-2" showText={false} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="panel p-5">
            <PixelTitle className="text-xs text-cosmos-gold">BADGES EARNED</PixelTitle>
            {earned.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">No badges yet.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                {earned.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 rounded-lg border border-cosmos-gold/30 bg-cosmos-gold/5 px-3 py-2"
                    title={b.desc}
                  >
                    <span className="text-xl">{b.icon}</span>
                    <span className="text-sm font-semibold text-white">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ['Level', p.level],
              ['Quests / mo', p.quests],
              ['Top trait', `Lv ${p.statLevel}`],
            ].map(([k, v]) => (
              <div key={k as string} className="panel p-4 text-center">
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{k}</div>
                <div className="mt-1 font-pixel text-lg text-[var(--accent)]">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link to="/app/leaderboards" className="text-xs uppercase tracking-widest text-[var(--muted)] hover:text-white">
          View the leaderboards →
        </Link>
      </div>
    </div>
  )
}
