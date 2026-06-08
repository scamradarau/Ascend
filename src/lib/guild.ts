import { supabase } from './supabase'

// ================================================================
// GUILD — shared community group chat (backend, per channel).
// Cloud-only; degrades to no-ops without Supabase.
// ================================================================

export interface GuildMessageRow {
  id: string
  channel: string
  sender: string
  body: string | null
  image_url: string | null
  created_at: string
}

// Latest N messages for a channel, returned oldest → newest.
export async function fetchGuildMessages(channel: string, limit = 100): Promise<GuildMessageRow[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('guild_messages')
    .select('*')
    .eq('channel', channel)
    .order('created_at', { ascending: false })
    .limit(limit)
  const rows = (data as GuildMessageRow[]) ?? []
  return rows.reverse()
}

// Latest post time per channel (for unread dots) — one cheap query.
export async function fetchChannelActivity(): Promise<Record<string, string>> {
  if (!supabase) return {}
  const { data } = await supabase
    .from('guild_messages')
    .select('channel,created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  const out: Record<string, string> = {}
  for (const r of (data as { channel: string; created_at: string }[]) ?? []) {
    if (!out[r.channel]) out[r.channel] = r.created_at // first seen = newest (desc order)
  }
  return out
}

export async function sendGuildMessage(
  me: string,
  channel: string,
  body: string,
  imageUrl?: string | null,
): Promise<{ error?: string }> {
  if (!supabase) return { error: 'unavailable' }
  const text = body.trim().slice(0, 2000)
  if (!text && !imageUrl) return { error: 'empty' }
  const { error } = await supabase.from('guild_messages').insert({
    channel,
    sender: me,
    body: text || null,
    image_url: imageUrl ?? null,
  })
  return { error: error?.message }
}
