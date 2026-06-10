import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { useAuth } from '../store/auth'
import { useSocial, selectFriendIds, selectOutgoing } from '../store/social'
import { getAllPlayers, getAllPlayersCloud, type PlayerRow } from '../store/leaderboard'
import { isCloud, isOwnerEmail } from '../lib/supabase'
import { socialUnlocked } from '../lib/community'
import { rankForLevel } from '../data/ranks'
import ClassAvatar from '../components/ClassAvatar'
import InviteButton from '../components/InviteButton'
import { PixelTitle, Pill, Toast } from '../components/ui'

function PlayerMini({
  p,
  action,
}: {
  p: PlayerRow
  action: React.ReactNode
}) {
  const navigate = useNavigate()
  const rank = rankForLevel(p.level)
  return (
    <div className="panel flex items-center gap-3 p-3">
      <button onClick={() => navigate(`/app/player/${p.id}`)} className="shrink-0">
        <ClassAvatar level={p.level} config={p.avatar} size={56} animated={false} />
      </button>
      <button
        onClick={() => navigate(`/app/player/${p.id}`)}
        className="flex-1 text-left"
      >
        <div className="font-display font-bold text-white">{p.handle}</div>
        <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
          {rank.title} · Lv {p.level} · {p.region}
        </div>
      </button>
      {action}
    </div>
  )
}

export default function Friends() {
  const navigate = useNavigate()
  const authUser = useAuth((s) => s.user)
  const localFriends = useGame((s) => s.friends)
  const ownerMode = useGame((s) => s.ownerMode)
  const owner = ownerMode && isOwnerEmail(authUser?.email)
  const addFriend = useGame((s) => s.addFriend)
  const removeFriend = useGame((s) => s.removeFriend)

  // cloud social: requests + accepted friends
  const cloudFriendIds = useSocial(selectFriendIds)
  const outgoing = useSocial(selectOutgoing)
  const sendRequest = useSocial((s) => s.sendRequest)
  const unfriendCloud = useSocial((s) => s.unfriend)
  const outgoingIds = new Set(outgoing.map((r) => r.to_user))

  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 1800)
  }

  const [cloudRows, setCloudRows] = useState<PlayerRow[] | null>(null)
  useEffect(() => {
    if (isCloud) getAllPlayersCloud().then(setCloudRows).catch(() => setCloudRows([]))
  }, [])

  const friendIds = isCloud ? cloudFriendIds : localFriends
  const players = useMemo(
    () => (isCloud ? cloudRows ?? [] : getAllPlayers()).filter((p) => p.id !== authUser?.id),
    [authUser, cloudRows],
  )
  const friendRows = players.filter((p) => friendIds.includes(p.id))
  const others = players.filter((p) => !friendIds.includes(p.id))
  const matches = query.trim()
    ? others.filter((p) => p.handle.toLowerCase().includes(query.trim().toLowerCase()))
    : others
  // soft-gate discovery until there's real density (owner bypasses)
  const discoverUnlocked = socialUnlocked(players.length, owner)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PixelTitle className="text-xs text-[var(--accent)]">FRIENDS</PixelTitle>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">Your circle</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add friends, view their builds, and keep each other accountable on the climb.
          </p>
        </div>
        <InviteButton />
      </div>

      {/* search / add */}
      {discoverUnlocked && (
        <div className="panel mb-6 p-4">
          <label className="stat-label mb-1.5 block text-xs">Find players by handle</label>
          <input
            className="input"
            placeholder="Search handle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* my friends */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-pixel text-xs text-[var(--accent)]">MY FRIENDS</span>
            <Pill tone="exp">{friendRows.length}</Pill>
          </div>
          <div className="space-y-2">
            {friendRows.length === 0 && (
              <div className="panel p-6 text-center text-sm text-[var(--muted)]">
                No friends yet — add some from the list on the right.
              </div>
            )}
            {friendRows.map((p) => (
              <PlayerMini
                key={p.id}
                p={p}
                action={
                  <div className="flex gap-1.5">
                    {isCloud && (
                      <button
                        onClick={() => navigate(`/app/messages/${p.id}`)}
                        className="btn btn-primary text-[11px]"
                      >
                        ✉ Message
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isCloud) unfriendCloud(p.id)
                        else removeFriend(p.id)
                        flash(`Removed ${p.handle}`)
                      }}
                      className="btn btn-ghost text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </div>

        {/* discover */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-pixel text-xs text-[var(--accent)]">DISCOVER PLAYERS</span>
            {discoverUnlocked && <Pill>{matches.length}</Pill>}
          </div>
          {!discoverUnlocked ? (
            <div className="panel p-6 text-center">
              <div className="mb-2 text-3xl">🧭</div>
              <p className="text-sm text-white">Player discovery opens soon</p>
              <p className="mx-auto mt-1.5 max-w-xs text-xs text-[var(--muted)]">
                We’re still gathering the founding members. For now, grow your circle by inviting
                people directly — your invites work right away.
              </p>
              <div className="mt-4 flex justify-center">
                <InviteButton />
              </div>
            </div>
          ) : (
          <div className="space-y-2">
            {matches.length === 0 && (
              <div className="panel p-6 text-center text-sm text-[var(--muted)]">
                {others.length === 0
                  ? 'No other players have signed up yet. Invite your friends to Ascend!'
                  : 'No players match that search.'}
              </div>
            )}
            {matches.map((p) => {
              const requested = isCloud && outgoingIds.has(p.id)
              return (
                <PlayerMini
                  key={p.id}
                  p={p}
                  action={
                    requested ? (
                      <button disabled className="btn btn-ghost text-[11px] opacity-60">
                        Requested
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (isCloud) {
                            sendRequest(p.id)
                            flash(`Request sent to ${p.handle}`)
                          } else {
                            addFriend(p.id)
                            flash(`Added ${p.handle}`)
                          }
                        }}
                        className="btn btn-primary text-[11px]"
                      >
                        {isCloud ? '+ Request' : '+ Add'}
                      </button>
                    )
                  }
                />
              )
            })}
          </div>
          )}
        </div>
      </div>
      <Toast message={toast} />
    </div>
  )
}
