# Web push notifications through Convex

End-to-end flow: the browser subscribes via the service worker's
`PushManager` → the subscription (endpoint + keys) is stored in Convex →
a Convex **Node action** sends the push with the `web-push` npm package →
the service worker's `push` handler shows the notification — even when the
PWA is backgrounded or fully closed. Templates:
`src/util/push.ts` (client), `convex/push.ts` (storage + scheduling),
`convex/pushNode.ts` (sender), plus the `push` / `notificationclick`
handlers already in `src/sw.ts`.

## Data model

`push_subscriptions` table (in the schema template): `user_id` (Clerk
subject, `v.string()`), `endpoint`, `p256dh`, `auth`, `created_at`, with
indexes `by_user_id` and `by_endpoint`. One row per browser/device;
dedupe by `endpoint` (re-subscribing on the same device patches in place).
A user can have several rows — send to all of them.

## Client: subscribing

`enablePush()` in `src/util/push.ts` does the whole dance: feature-detect,
`Notification.requestPermission()`, `pushManager.subscribe()` with the VAPID
public key (converted base64url → `Uint8Array`), then persists via a Convex
mutation. Call it **from a click handler** — iOS rejects permission prompts
that don't originate from a user gesture. Typical wiring:

```tsx
const save = useMutation(api.push.savePushSubscription);
<button onClick={() => enablePush((sub) => save(sub))}>Enable reminders</button>
```

## Server: sending

Two Convex functions cooperate (this split is mandatory — `web-push` needs
Node, and `"use node"` files can't export queries/mutations):

- `convex/push.ts` — regular runtime: save/delete subscription mutations,
  `internalQuery` to fetch a user's subscriptions, `internalMutation` to
  prune dead ones.
- `convex/pushNode.ts` — `"use node"` `internalAction`: reads
  `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` from the Convex
  env, calls `webpush.sendNotification()` per subscription, and prunes any
  subscription that returns **404 or 410** (the push service saying "this
  subscription is dead" — without pruning, the table fills with corpses and
  every send does wasted work).

Send options worth setting per notification type: `TTL` (seconds the push
service holds an undeliverable message) and `urgency`. Time-sensitive alerts
(timers, reminders): `{ TTL: 300, urgency: "high" }` — a rest-timer push
arriving hours late is worse than none. Digest-style content can use long
TTLs and `"normal"`.

## Scheduling — how pushes fire with the app closed

Convex's scheduler is the engine. From any mutation:

```ts
await ctx.scheduler.runAfter(ms, internal.pushNode.sendToUser, { userId, ... });
```

returns an `Id<"_scheduled_functions">` — hand it back to the client if the
user may cancel (e.g. stopping a timer early → `ctx.scheduler.cancel(id)`).
For recurring reminders use `convex/crons.ts` (e.g. a daily cron that queries
who's due and fans out to the Node action). A useful pattern for "remind me
unless I already saw it": schedule the push a few seconds *after* the
in-app deadline, and have the foreground client cancel it when it handles the
event itself — the push then only fires when the app couldn't alert the user.

## Service worker handlers

Already in the `sw.ts` template:

- `push`: parse the JSON payload (`{ title, body, tag, url }`, all optional
  with app-default fallbacks — never let a malformed payload throw), then
  `self.registration.showNotification(title, { body, icon, badge, tag, data: { url } })`.
  `tag` replaces a previous notification with the same tag instead of
  stacking.
- `notificationclick`: close the notification, focus an existing window
  (navigating it to `data.url` when present) or `clients.openWindow(url)`.

## iOS constraints (most support questions come from here)

- Web push only works for PWAs **installed to the home screen** (iOS 16.4+),
  never in Safari tabs. Detect: `matchMedia("(display-mode: standalone)")`.
- The permission prompt must come from a user gesture (button tap).
- If the user deletes the home-screen app, subscriptions die silently — the
  404/410 pruning is what cleans these up.
- No icons in the manifest → install works but notifications may show a
  blank icon; ship `pwa-192x192.png` and reference it in `showNotification`.
