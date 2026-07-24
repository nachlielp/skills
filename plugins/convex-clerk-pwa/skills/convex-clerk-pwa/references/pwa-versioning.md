# PWA caching + versioning: cached offline, never stale

The goal is two properties that naively conflict:

1. **Installable/offline**: the app shell is precached, so the PWA opens
   instantly with no network.
2. **Always current**: within ~a minute of a deploy, every open tab is
   running the new build — no "close and reopen the app twice" folklore, no
   users filing bugs against code you deleted last week.

Three files implement this as one machine. If any piece is missing the
system degrades to the classic stale-PWA bug, so when retrofitting, check
all three.

## Piece 1 — the service worker (`src/sw.ts`)

Built with `vite-plugin-pwa` in `injectManifest` mode: Workbox injects the
precache manifest (every hashed build asset + `index.html`) into a
hand-written worker at build time. Because asset filenames are content-hashed,
every deploy produces a byte-different `sw.js`, which is what makes the
browser treat it as an update.

The worker must self-activate:

```ts
void self.skipWaiting();               // don't wait for old tabs to close
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim()); // take over open tabs immediately
});
```

Without `skipWaiting()`, the new worker sits in "waiting" until *every* tab
and the installed PWA are fully closed — on iOS that can be days.

## Piece 2 — the registration block (`src/main.tsx`)

Registered manually (`injectRegister: false`) because we need custom update
behavior:

- `navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })`
  — `updateViaCache: "none"` makes the browser bypass its HTTP cache when
  re-fetching the worker script.
- **Reload on takeover**: when the new worker calls `clients.claim()`, the
  page fires `controllerchange`. Reload once so the tab loads the new hashed
  assets instead of serving the old precache. Two guards matter:
  - a `refreshing` flag so multiple events cause one reload, and
  - skip the *first* `controllerchange` after the very first install (the
    page wasn't controlled before), otherwise every new user's first visit
    reloads for no reason.
- **Update polling**: browsers only auto-check the SW script on navigation,
  and an installed PWA may not "navigate" for weeks. So call
  `registration.update()` explicitly: on startup, on a 60s interval, on
  `visibilitychange` → visible (the "user reopens the PWA" moment — this one
  matters most on iOS), and on `online`. Deduplicate concurrent checks with
  an in-flight promise.

Register only in production (`import.meta.env.PROD`) — a SW in dev fights
Vite's HMR.

## Piece 3 — HTTP cache headers (`vercel.json`)

The browser's HTTP cache sits *under* the SW and will happily serve a
week-old `sw.js` or `index.html`, silently defeating pieces 1–2:

| Path | Header | Why |
|---|---|---|
| `/sw.js` | `no-cache, no-store, must-revalidate` | update checks must always hit the network |
| `/index.html` | `no-cache, must-revalidate` | uncontrolled first loads must see the newest asset hashes |
| `/manifest*.webmanifest` | `no-cache, must-revalidate` | manifest edits (icons, name) propagate |
| `/assets/*` | `public, max-age=31536000, immutable` | content-hashed, safe forever, makes reloads cheap |
| all extensionless routes | `no-cache` + rewrite to `/index.html` | SPA routing |

## Version stamping

`vite.config.ts` compiles two constants in via `define`:

- `__APP_VERSION__` — human-readable build date (e.g. `25-07-26`, rendered in
  the UI footer),
- `__BUILD_HASH__` — first 7 chars of the git SHA
  (`VERCEL_GIT_COMMIT_SHA ?? GITHUB_SHA ?? "local"`), rendered as a data
  attribute.

Declare both in `src/vite-env.d.ts` (`declare const __APP_VERSION__: string;`).
Render them somewhere always visible (footer). This isn't what *drives*
updates (the SW does) — it's the observability: "what version do you see?"
becomes answerable, and after deploying you can watch an open tab flip to the
new version by itself, which is the acceptance test for this whole setup.

## Verifying after deploy

1. Open the deployed app, note the footer version.
2. Deploy a trivial change.
3. Without touching the tab, it should reload itself within ~60s and show the
   new version. If it doesn't, check (in order): `vercel.json` headers
   actually served (`curl -sI https://app/sw.js | grep -i cache-control`),
   the SW registered (`navigator.serviceWorker.controller` in the console),
   and `skipWaiting` present in the built `dist/sw.js`.
