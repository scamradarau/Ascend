# Push notifications — setup

The client + Edge Functions are built. To go live you need VAPID keys, a
few secrets, and a daily schedule. ~10 minutes.

## 1. Generate a VAPID key pair (once)

```bash
npx web-push generate-vapid-keys
```

Copy the **Public Key** and **Private Key**.

## 2. Front-end env (Netlify)

Add the **public** key to the site build env so the browser can subscribe:

```
VITE_VAPID_PUBLIC_KEY = <public key>
```

Netlify → Site settings → Environment variables → add → redeploy.

## 3. Database

Run `supabase/step6_push.sql` in the Supabase SQL editor (creates
`push_subscriptions` + RLS).

## 4. Edge Functions

Deploy two new functions (dashboard → Edge Functions → Deploy new
function), **Verify JWT OFF**, paste the files:

- `send-push` ← `supabase/functions/send-push/index.ts`
- `daily-reminders` ← `supabase/functions/daily-reminders/index.ts`

## 5. Function secrets

Set these (dashboard → Edge Functions → Secrets, or `supabase secrets set`):

```
VAPID_PUBLIC_KEY  = <public key>          # same as the front-end one
VAPID_PRIVATE_KEY = <private key>         # keep secret, server only
VAPID_SUBJECT     = mailto:you@yourdomain # contact for push services
CRON_SECRET       = <any long random string>  # gates the daily blast
```

## 6. Schedule the daily blast

In the Supabase SQL editor enable pg_cron + pg_net, then schedule
`daily-reminders` (this example fires 19:00 UTC daily — pick a time that
suits your players' evening):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'ascend-daily-reminders',
  '0 19 * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR-PROJECT-REF>.functions.supabase.co/daily-reminders?secret=<CRON_SECRET>',
    headers := '{"Content-Type":"application/json"}'::jsonb
  );
  $$
);
```

(Replace `<YOUR-PROJECT-REF>` and `<CRON_SECRET>`.)

## 7. Test

1. Open the app on HTTPS (Netlify), Settings → **Daily streak reminders** → on,
   accept the browser prompt.
2. Hit **Send a test notification** — you should get a push within seconds.
3. Manually fire the blast to verify targeting:
   `curl -X POST 'https://<ref>.functions.supabase.co/daily-reminders?secret=<CRON_SECRET>'`

## Notes

- iOS only allows web push when the site is **installed to the Home Screen**
  (Add to Home Screen) on iOS 16.4+. Android/desktop Chrome/Firefox/Edge work
  from the browser directly.
- Dead subscriptions (404/410) are auto-pruned when a send fails.
- `daily-reminders` only nudges users whose `profiles.last_active` isn't today,
  so people who already checked in are left alone.
