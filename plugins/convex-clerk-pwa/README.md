# convex-clerk-pwa

One specific, proven way to ship a production PWA — encoded as a Claude Code
skill. Every template is lifted from a live app running this exact stack, so
the sharp edges are already handled: iOS push quirks, stale-cache-after-deploy,
subscription pruning.

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript (SPA, react-router) |
| Hosting | Vercel — static hosting + cache headers via `vercel.json` |
| Database + backend | Convex — queries/mutations/actions, scheduler, crons |
| Auth | Clerk — JWT template named `convex`, validated by Convex |
| PWA | `vite-plugin-pwa` (injectManifest) + Workbox, hand-written `src/sw.ts` |
| Push | Web Push (VAPID) via `web-push` in a Convex Node action |
| Versioning | build-time `__APP_VERSION__`/`__BUILD_HASH__` + auto-updating SW |

## Install

```
/plugin marketplace add nachlielp/skills
```

```
/plugin install convex-clerk-pwa@nachlielp-skills
```

Or copy [`skills/convex-clerk-pwa`](skills/convex-clerk-pwa) into
`~/.claude/skills/` (all projects) or `.claude/skills/` (one project).

## When it activates

Ask for a new app on "this stack" / "my usual stack", any Convex + Clerk +
Vercel project, an installable PWA with push notifications, a fix for stale
caches after deploy, or a preflight check that every external service is
connected. Invoke it directly with `/convex-clerk-pwa`.

## The workflow

Six phases, each independently applicable — so you can scaffold a whole app, or
graft one piece onto an app you already have.

0. **Preflight** — `bash scripts/preflight.sh [project-dir]` checks local
   tooling (node ≥ 20, pnpm, git), Convex login + project link, Clerk keys,
   Vercel CLI login + project link, and VAPID keys. Every failing check prints
   its exact fix, and the skill walks you through signing up for whatever's
   missing, one service at a time.
1. **Scaffold** — Vite + deps, then the file templates.
2. **Convex backend** — schema conventions: snake_case fields, explicit
   `returns` validators, an index for every query pattern.
3. **Clerk auth** — the integration has three moving parts that must all agree
   on the literal string `"convex"`; the reference spells them out.
4. **PWA caching + versioning** — the app opens instantly offline from cache,
   yet a deploy reaches every open tab within about a minute, automatically.
   `sw.ts`, the registration block in `main.tsx`, and `vercel.json` form one
   machine; remove any piece and you get the classic "users stuck on last
   week's build" bug.
5. **Push notifications** — sent from a Convex `"use node"` action via
   `ctx.scheduler.runAfter`, so notifications fire even when the app is closed.
6. **Deploy to Vercel** — build command `npx convex deploy --cmd 'pnpm build'`,
   so every frontend deploy ships the matching backend.

## What's in it

- **[SKILL.md](skills/convex-clerk-pwa/SKILL.md)** — the phase-by-phase
  workflow and the retrofit guidance.
- **[assets/templates/](skills/convex-clerk-pwa/assets/templates)** — working
  files to copy and adapt: `vite.config.ts`, `vercel.json`,
  `tsconfig.worker.json`, `src/sw.ts`, `src/main.tsx`, `src/util/push.ts`,
  `convex/schema.ts`, `convex/auth.config.ts`, `convex/push.ts`,
  `convex/pushNode.ts`.
- **[scripts/preflight.sh](skills/convex-clerk-pwa/scripts/preflight.sh)** —
  the service-connectivity check.
- **references/** —
  [preflight](skills/convex-clerk-pwa/references/preflight.md) (per-service
  signup walkthroughs + which env var lives where),
  [clerk-convex](skills/convex-clerk-pwa/references/clerk-convex.md),
  [pwa-versioning](skills/convex-clerk-pwa/references/pwa-versioning.md),
  [push-notifications](skills/convex-clerk-pwa/references/push-notifications.md),
  [deploy-vercel](skills/convex-clerk-pwa/references/deploy-vercel.md).
- **[evals/evals.json](skills/convex-clerk-pwa/evals/evals.json)** — the test
  cases the skill is checked against.

## Accounts you'll need

[Convex](https://convex.dev), [Clerk](https://dashboard.clerk.com) and
[Vercel](https://vercel.com) — all have free tiers. VAPID keys need no account:
`npx web-push generate-vapid-keys`. The skill never asks you to paste secret
keys into chat; they go into `.env.local`, the Convex dashboard, or Vercel env
vars directly.
