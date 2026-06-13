import { supabase } from './supabase'

// ================================================================
// PUSH — Web Push subscription plumbing. Registers the service worker,
// asks permission, subscribes with the VAPID public key, and stores the
// subscription in Supabase so the backend can send daily streak
// reminders (the missing re-engagement channel). All best-effort.
//
// Requires VITE_VAPID_PUBLIC_KEY (the public half of your VAPID pair)
// in the build env; see supabase/PUSH_SETUP.md.
// ================================================================

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

export const pushConfigured = () => Boolean(VAPID_PUBLIC)

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

/** Keep the SW warm on load if the user already opted in. */
export async function initServiceWorker() {
  if (!pushSupported()) return
  if (Notification.permission === 'granted') await registerServiceWorker()
}

export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    return Boolean(sub)
  } catch {
    return false
  }
}

export async function enablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) return { ok: false, error: 'This browser doesn’t support notifications.' }
  if (!VAPID_PUBLIC) return { ok: false, error: 'Push isn’t configured yet (missing VAPID key).' }

  const perm = await Notification.requestPermission()
  if (perm !== 'granted')
    return { ok: false, error: 'Notifications weren’t allowed. You can re-enable them in your browser settings.' }

  const reg = await registerServiceWorker()
  if (!reg) return { ok: false, error: 'Could not register the service worker.' }
  await navigator.serviceWorker.ready

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      })
    } catch {
      return { ok: false, error: 'Could not subscribe to push on this device.' }
    }
  }

  const saved = await saveSubscription(sub)
  return saved ? { ok: true } : { ok: false, error: 'Could not save your subscription. Are you signed in?' }
}

async function saveSubscription(sub: PushSubscription): Promise<boolean> {
  if (!supabase) return false
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      reminders_enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  )
  return !error
}

export async function disablePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      if (supabase) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      await sub.unsubscribe()
    }
  } catch {
    /* best-effort */
  }
}

/** Fire a test push to yourself (via the send-push Edge Function). */
export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'No backend.' }
  const res = await supabase.functions.invoke('send-push', { body: { test: true } })
  const data = (res.data as { ok?: boolean; error?: string } | null) ?? {}
  if (res.error || data.error) return { ok: false, error: data.error ?? res.error?.message }
  return { ok: true }
}
