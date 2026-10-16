---
name: convex-clerk-pwa
description: >-
  Build, scaffold, or extend apps on this standard production stack: a React + Vite
  PWA hosted on Vercel, Convex as the database and cloud functions, Clerk for
  auth, a service worker that shows web-push notifications, and a versioning
  system that keeps the PWA cached offline yet always up to date after a
  deploy. Use this skill whenever the user wants a new app "on my stack" / "my
  usual stack", any Convex + Clerk + Vercel project, an installable PWA with
  push notifications, a "stale cache after deploy" fix, or a preflight check
  that all external services (Convex, Clerk, Vercel, VAPID keys) are connected
  — walking them through signup for any that are missing.
---

# Convex + Clerk + Vercel PWA stack

This skill encodes one specific, proven way to build a production PWA. Every
template in `assets/templates/` is lifted from a live app that runs this exact
stack, so prefer copying and adapting a template over writing the file from
scratch — the templates already handle the sharp edges (iOS push quirks,
stale-cache-after-deploy, subscription pruning).

## The stack at a glance

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | SPA with react-router |
| Hosting | Vercel | static hosting + cache headers via `vercel.json` |
| Database + backend | Convex | queries/mutations/actions, scheduler, crons |
| Auth | Clerk | JWT template named `convex`, validated by Convex |
| PWA | `vite-plugin-pwa` (injectManifest) + Workbox | hand-written `src/sw.ts` |
| Push | Web Push (VAPID) via `web-push` in a Convex Node action | works on iOS home-screen PWAs |
| Versioning | build-time `__APP_VERSION__`/`__BUILD_HASH__` + auto-updating SW | users never see a stale build |

## Workflow

Work through the phases in order for a new app; jump straight to the relevant
phase (and its reference file) when retrofitting one piece onto an existing
app.

### Phase 0 — Preflight: verify access to every external service

Before building anything, run the bundled check:

```bash
bash <skill-dir>/scripts/preflight.sh [project-dir]
```

It reports, per service: local tooling (node ≥ 20, pnpm, git), Convex login +
project link, Clerk keys, Vercel CLI login + project link, and VAPID push
keys. Each failing check prints the exact fix.

For anything missing, don't just dump the script output on the user — walk
them through connecting each service one at a time (signup URL, what to click,
which key to copy, where it goes). The per-service walkthroughs, and the
env-var matrix explaining which variable lives where (`.env.local` vs Convex
dashboard vs Vercel), are in `references/preflight.md`. Read it whenever any
check fails or the user asks "what do I need to sign up for?".

Services that need accounts: [Convex](https://convex.dev),
[Clerk](https://dashboard.clerk.com), [Vercel](https://vercel.com). VAPID keys
need no account — generate them with `npx web-push generate-vapid-keys`.

### Phase 1 — Scaffold

```bash
pnpm create vite <app-name> --template react-ts
cd <app-name> && git init
pnpm add convex @clerk/clerk-react react-router-dom web-push
pnpm add -D vite-plugin-pwa workbox-precaching workbox-routing workbox-strategies workbox-expiration @types/web-push npm-run-all
```

Then copy these templates in, replacing the `__PLACEHOLDER__` markers
(app name, description, theme color):

- `assets/templates/vite.config.ts` → `vite.config.ts` (PWA manifest, version defines)
- `assets/templates/vercel.json` → `vercel.json` (cache headers — critical, see Phase 4)
- `assets/templates/tsconfig.worker.json` → `tsconfig.worker.json`
- `assets/templates/src/sw.ts` → `src/sw.ts`
- `assets/templates/src/main.tsx` → `src/main.tsx` (providers + SW registration)
- `assets/templates/src/vite-env.d.ts` → `src/vite-env.d.ts`

Wire the worker tsconfig in: add `{ "path": "./tsconfig.worker.json" }` to the
root `tsconfig.json` references and `"exclude": ["src/sw.ts"]` to
`tsconfig.app.json` — the SW compiles against `WebWorker` libs, the app
against `DOM`, and mixing them produces confusing type errors.

Set `"dev": "npm-run-all --parallel dev:frontend dev:backend"` with
`dev:frontend: vite` and `dev:backend: convex dev` so one command runs both.

PWA icons: the manifest needs `pwa-192x192.png`, `pwa-512x512.png` and
`apple-touch-icon-180.png` in `public/`. Generate them from a single SVG
source early — an installable PWA without icons fails silently on iOS.

### iPhone form inputs — prevent persistent focus zoom

Keep the computed font size of `input`, `textarea`, and `select` controls at
least **16 CSS pixels** on mobile, including search fields and modal forms.
iOS can zoom into smaller text when a control receives focus and keep the
page zoomed after submission or dismissal, making the modal and surrounding
layout appear wider than the screen. Apply the size to the controls themselves;
small label fonts and shared CSS overrides can otherwise reduce inherited text.
Preserve pinch zoom rather than disabling scaling through viewport metadata.

Verify add/edit forms on a small iPhone viewport (375px wide), before focus,
while editing, and after saving or closing. Check that the dialog and page fit
without horizontal overflow; cover RTL and LTR when both are supported.
Browser tests can guard computed control sizes and layout bounds, but desktop
emulation does not reproduce native iOS keyboard zoom. Confirm that behavior
in the installed iPhone PWA when a device is available.

### Phase 2 — Convex backend

`npx convex dev` (first run: logs in, creates the project, writes
`CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` to `.env.local`, and keeps
`convex/_generated` in sync).

Schema conventions: snake_case field names, explicit `returns` validators on
every function, an index for every query pattern (never `.filter()` on a full
table scan).

Read `references/convex-patterns.md` before changing a schema or validator,
writing a delete/undo, or adding a by-id query:
- Installed PWAs run the previous bundle against the new functions, so every
  backend change must work with the old client too: new fields optional,
  retired values still accepted, and functions removed a release after
  nothing calls them.
- An undo must restore a denormalized `last_*` field on the parent, even
  when no children are left.
- A by-id read returns `null` for a missing record or someone else's, and is
  tested for both the owner and a stranger. Start `convex/schema.ts` from
`assets/templates/convex/schema.ts`, which includes the `push_subscriptions`
table the push module needs.

### Phase 3 — Clerk auth

Read `references/clerk-convex.md` and follow it exactly — the integration has
three moving parts (Clerk JWT template, `convex/auth.config.ts`, provider
nesting in `main.tsx`) and all three must agree on the literal string
`"convex"`. The template `assets/templates/convex/auth.config.ts` is the
backend half; `assets/templates/src/main.tsx` already nests
`ClerkProvider → ConvexProviderWithClerk` correctly.

### Optional — MCP connections without manual OAuth credentials

When adding a Clerk-authenticated MCP server or removing manual client ID and
secret entry from its connection flow, read `references/mcp-oauth.md`. Prefer
CIMD for compatible clients; use DCR when the client requires it. Keep user
sign-in, consent, scopes, and Convex authorization in place. Apply this only
when an MCP integration is part of the requested app work.

### Phase 4 — PWA caching + versioning

Goal: the app opens instantly offline from cache, yet a deploy reaches every
open tab within about a minute, automatically. The design and its rationale
are in `references/pwa-versioning.md` — read it before changing anything in
`sw.ts`, `main.tsx`'s registration block, or `vercel.json`, because the three
files form one machine: remove any piece and you get the classic "users stuck
on last week's build" bug.

The short version:
- SW precaches the app shell (`injectManifest` + Workbox) and calls
  `skipWaiting()` / `clients.claim()` so a new build activates immediately.
- The client reloads once on `controllerchange` (guarded so the *first*
  install doesn't reload) and polls `registration.update()` on startup, every
  60s, on tab-visible and on network-reconnect.
- `vercel.json` serves `sw.js`, `index.html` and manifests with `no-cache`
  and hashed `/assets/*` as `immutable` — without this the browser's HTTP
  cache silently defeats the whole update system.
- `__APP_VERSION__` (build date) and `__BUILD_HASH__` (git SHA) are compiled
  in via Vite `define` and rendered in the UI footer, so "which version are
  you on?" is always answerable.

### Phase 5 — Push notifications

Read `references/push-notifications.md`. Copy
`assets/templates/src/util/push.ts` (client subscribe helper),
`assets/templates/convex/push.ts` (subscription storage + scheduling) and
`assets/templates/convex/pushNode.ts` (the `"use node"` action that actually
sends via `web-push`). Key constraints baked into the templates:

- iOS only delivers web push to PWAs installed to the home screen, and
  `Notification.requestPermission()` must be called from a user gesture.
- Subscriptions go stale: a 404/410 from the push service means prune the row.
- Pushes are sent from a Convex **Node action** (`"use node"`), scheduled with
  `ctx.scheduler.runAfter` — this is how notifications fire even when the app
  is closed.

### Phase 6 — Deploy to Vercel

Read `references/deploy-vercel.md`. The one non-obvious part: the Vercel build
command is `npx convex deploy --cmd 'pnpm build'` (with `CONVEX_DEPLOY_KEY`
set in Vercel env vars), so every frontend deploy pushes the matching Convex
functions and injects the production `VITE_CONVEX_URL` at build time. After
the first deploy, verify the update loop end-to-end: deploy a trivial change
and confirm an already-open tab reloads itself within ~1 minute.

After every release, run the signed-out smoke test,
`node <skill-dir>/scripts/prod-smoke.mjs --url https://<app> --old <previous
entry bundle> --marker "<new copy>"`. It waits for the new bundle, then
checks:
- that the new code shipped, including lazy-loaded chunks and CSS,
- that deep links serve the app,
- console errors and failed requests,
- that the service worker activates.

Never sign in on production to test. The reference also covers the
dev → main release checks: whether Convex needs a deploy, and in what order.

## Retrofitting onto an existing app

The phases are independent enough to apply piecemeal — e.g. "my deployed PWA
serves stale builds" needs only Phase 4 (plus its reference file), "add
reminders" only Phase 5. When retrofitting, diff the template against the
user's existing file rather than overwriting: keep their manifest entries,
routes, and providers, and graft in the missing mechanism.
