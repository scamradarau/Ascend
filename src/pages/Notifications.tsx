import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocial, selectIncoming, selectOutgoing } from '../store/social'
import { isCloud } from '../lib/supabase'
import { levelFromTotalExp } from '../data/leveling'
import { DEFAULT_AVATAR, type AvatarConfig } from '../data/cosmetics'
import ClassAvatar from '../components/ClassAvatar'
import { PixelTitle, Pill } from '../components/ui'

export default function Notifications() {
  const navigate = useNavigate()
  const incoming = useSocial(selectIncoming)
  const outgoing = useSocial(selectOutgoing)
  const profiles = useSocial((s) => s.profiles)
  const respond = useSocial((s) => s.respond)
  const refresh = useSocial((s) => s.refresh)

  useEffect(() => {
    refresh()
  }, [refresh])

  if (!isCloud) {
    return (
      <div className="mx-auto max-w-2xl">
        <PixelTitle className="text-xs text-[var(--accent)]">NOTIFICATIONS</PixelTitle>
        <div className="panel mt-4 p-8 text-center text-sm text-[var(--muted)]">
          Friend requests &amp; notifications need a cloud account — they sync across devices.
        </div>
      </div>
    )
  }

  const lvl = (id: string) => levelFromTotalExp(profiles[id]?.total_exp ?? 0).level
  const av = (id: string): AvatarConfig => ({
    ...DEFAULT_AVATAR,
    ...((profiles[id]?.avatar as object) || {}),
  })
  const handle = (id: string) => profiles[id]?.handle ?? 'Ascender'

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">NOTIFICATIONS</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Friend requests</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Accept to become friends and unlock private messages.
        </p>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="font-pixel text-xs text-[var(--accent)]">INCOMING</span>
        <Pill tone="exp">{incoming.length}</Pill>
      </div>

      <div className="space-y-2">
        {incoming.length === 0 && (
          <div className="panel p-6 text-center text-sm text-[var(--muted)]">
            No pending requests. 🎉
          </div>
        )}
        {incoming.map((r) => (
          <div key={r.id} className="panel flex items-center gap-3 p-3">
            <button onClick={() => navigate(`/app/player/${r.from_user}`)} className="shrink-0">
              <ClassAvatar level={lvl(r.from_user)} config={av(r.from_user)} size={48} animated={false} />
            </button>
            <button onClick={() => navigate(`/app/player/${r.from_user}`)} className="flex-1 text-left">
              <div className="font-display font-bold text-white">{handle(r.from_user)}</div>
              <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                Lv {lvl(r.from_user)} · wants to be friends
              </div>
            </button>
            <button onClick={() => respond(r.id, false)} className="btn btn-ghost text-[11px]">
              Decline
            </button>
            <button onClick={() => respond(r.id, true)} className="btn btn-primary text-[11px]">
              Accept
            </button>
          </div>
        ))}
      </div>

      {outgoing.length > 0 && (
        <>
          <div className="mb-3 mt-8 flex items-center justify-between">
            <span className="font-pixel text-xs text-[var(--muted)]">SENT (PENDING)</span>
            <Pill tone="default">{outgoing.length}</Pill>
          </div>
          <div className="space-y-2">
            {outgoing.map((r) => (
              <div key={r.id} className="panel flex items-center gap-3 p-3 opacity-80">
                <ClassAvatar level={lvl(r.to_user)} config={av(r.to_user)} size={40} animated={false} />
                <div className="flex-1">
                  <div className="font-display font-bold text-white">{handle(r.to_user)}</div>
                  <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Awaiting their response
                  </div>
                </div>
                <Pill tone="default">Pending</Pill>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
