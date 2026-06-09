import { supabase } from './supabase'
import type { CloudProfile } from './supabase'

// ================================================================
// SOCIAL — friend requests (accept/decline) + 1:1 direct messages.
// Cloud-only (requires Supabase). All functions degrade to no-ops /
// empty results when the client isn't configured.
// ================================================================

export interface FriendRequestRow {
  id: string
  from_user: string
  to_user: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface MessageRow {
  id: string
  sender: string
  recipient: string
  body: string
  created_at: string
  read_at: string | null
}

// ---- friend requests ----

// Send a request. If the other person already requested YOU, accept theirs
// instead (mutual → instant friends).
export async function sendFriendRequest(me: string, to: string): Promise<{ error?: string }> {
  if (!supabase || me === to) return { error: 'unavailable' }
  // did they already request me?
  const { data: incoming } = await supabase
    .from('friend_requests')
    .select('id,status')
    .eq('from_user', to)
    .eq('to_user', me)
    .maybeSingle()
  if (incoming) {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', incoming.id)
    return {}
  }
  const { error } = await supabase
    .from('friend_requests')
    .upsert({ from_user: me, to_user: to, status: 'pending' }, { onConflict: 'from_user,to_user' })
  return { error: error?.message }
}

export async function respondFriendRequest(id: string, accept: boolean) {
  if (!supabase) return
  await supabase
    .from('friend_requests')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', id)
}

// Remove a friendship / cancel a request (either accepted or pending row).
export async function removeFriendship(me: string, other: string) {
  if (!supabase) return
  await supabase
    .from('friend_requests')
    .delete()
    .or(
      `and(from_user.eq.${me},to_user.eq.${other}),and(from_user.eq.${other},to_user.eq.${me})`,
    )
}

// Every request row involving me (used to derive friends / incoming / outgoing).
export async function fetchMyRequests(me: string): Promise<FriendRequestRow[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`from_user.eq.${me},to_user.eq.${me}`)
  return (data as FriendRequestRow[]) ?? []
}

// ---- messages ----

export async function sendMessage(me: string, to: string, body: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'unavailable' }
  const text = body.trim().slice(0, 2000)
  if (!text) return { error: 'empty' }
  const { error } = await supabase.from('messages').insert({ sender: me, recipient: to, body: text })
  return { error: error?.message }
}

// All my messages (recent first), capped — enough to build conversations + unread.
export async function fetchMyMessages(me: string, limit = 400): Promise<MessageRow[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(`sender.eq.${me},recipient.eq.${me}`)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as MessageRow[]) ?? []
}

export async function markConversationRead(me: string, other: string) {
  if (!supabase) return
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient', me)
    .eq('sender', other)
    .is('read_at', null)
}

// ---- profiles (batch, for handles/avatars/levels) ----
export async function fetchProfilesByIds(ids: string[]): Promise<CloudProfile[]> {
  if (!supabase || ids.length === 0) return []
  const { data } = await supabase.from('profiles').select('*').in('id', ids)
  return (data as CloudProfile[]) ?? []
}

// ---- submissions + review ----
export interface SubmissionRow {
  id: string
  user_id: string
  quest_id: string
  label: string | null
  method: string | null
  status: 'verified' | 'pending' | 'flagged'
  exp_awarded: number | null
  thumb?: string | null
  created_at: string
}

// my own recent submissions (drives quest review states + result alerts)
export async function fetchMySubmissions(me: string, limit = 200): Promise<SubmissionRow[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('submissions')
    .select('id,user_id,quest_id,label,method,status,exp_awarded,created_at')
    .eq('user_id', me)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as SubmissionRow[]) ?? []
}

// pending submissions awaiting review (admins see everyone's via RLS)
export async function fetchPendingReview(limit = 100): Promise<SubmissionRow[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('submissions')
    .select('id,user_id,quest_id,label,method,status,exp_awarded,thumb,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)
  return (data as SubmissionRow[]) ?? []
}

export async function reviewSubmission(id: string, decision: 'approve' | 'reject') {
  if (!supabase) return { error: 'unavailable' as const }
  const { data, error } = await supabase.functions.invoke('review-submission', {
    body: { submission_id: id, decision },
  })
  return { data, error: error?.message }
}

// am I an admin (reviewer)?
export async function fetchIsAdmin(me: string): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', me).maybeSingle()
  return Boolean(data)
}
