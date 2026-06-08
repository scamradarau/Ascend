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
