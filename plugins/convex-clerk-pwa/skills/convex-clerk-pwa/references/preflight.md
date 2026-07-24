# Preflight: connecting every external service

The stack touches three external services (Convex, Clerk, Vercel) plus one
locally-generated keypair (VAPID). This file has the per-service walkthroughs
for when `scripts/preflight.sh` reports something missing, and the env-var
matrix that says where every variable lives.

When walking a user through signup, do one service at a time, confirm it
works (re-run the relevant preflight section) before moving to the next, and
never ask the user to paste secret keys into chat — have them put keys
directly into `.env.local` / the dashboards themselves, or run the CLI
commands that do it.

## Env-var matrix — where does each variable live?

This is the most confusing part of the stack: there are three separate
environment stores, and each variable belongs in exactly one or two of them.

| Variable | `.env.local` (dev) | Convex dashboard env | Vercel project env | Who reads it |
|---|---|---|---|---|
| `CONVEX_DEPLOYMENT` | ✓ (written by `convex dev`) | — | — | Convex CLI |
| `VITE_CONVEX_URL` | ✓ (written by `convex dev`) | — | injected at build by `convex deploy --cmd` | frontend |
| `CONVEX_DEPLOY_KEY` | — | — | ✓ | Vercel build step |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✓ | — | ✓ | frontend (`ClerkProvider`) |
| `CLERK_JWT_ISSUER_DOMAIN` | — | ✓ (dev AND prod deployment) | — | `convex/auth.config.ts` |
| `VITE_VAPID_PUBLIC_KEY` | ✓ | — | ✓ | frontend (`pushManager.subscribe`) |
| `VAPID_PUBLIC_KEY` | — | ✓ | — | Convex Node action (`web-push`) |
| `VAPID_PRIVATE_KEY` | — | ✓ | — | Convex Node action (`web-push`) |
| `VAPID_SUBJECT` | — | ✓ | — | Convex Node action (`mailto:you@example.com`) |

Rules of thumb: `VITE_*` variables are compiled into the frontend bundle, so
they are public by definition and needed wherever a build happens (locally
and on Vercel). Secrets that back-end functions read (`VAPID_PRIVATE_KEY`,
`CLERK_JWT_ISSUER_DOMAIN`) live only in the Convex deployment env — set them
with `npx convex env set NAME value` or in the dashboard, and remember dev
and prod are **separate deployments with separate env vars**.

## Convex

1. Sign up at https://convex.dev (GitHub login is fastest). Free tier is fine.
2. In the project directory run `npx convex dev`. First run opens a browser
   login, offers to create a new project, then writes `CONVEX_DEPLOYMENT` and
   `VITE_CONVEX_URL` into `.env.local` and starts syncing `convex/`.
3. Verify: `.env.local` contains both vars, and `npx convex dashboard` opens
   the project.

Login state is stored in `~/.convex/config.json`; its absence means the CLI
has never logged in on this machine.

## Clerk

1. Sign up at https://dashboard.clerk.com and create an application. Pick the
   sign-in methods (email code + Google is a sensible default).
2. From **API Keys**, copy the *Publishable key* (`pk_test_...`) into
   `.env.local` as `VITE_CLERK_PUBLISHABLE_KEY`. The secret key is not needed
   — Convex validates JWTs, not API calls.
3. Create the JWT template: **Configure → JWT Templates → New template →
   Convex** (it's a built-in preset). Do not rename it — the template name
   must be exactly `convex`. Copy the **Issuer** URL
   (`https://<something>.clerk.accounts.dev`).
4. Set it on the Convex deployment:
   `npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<something>.clerk.accounts.dev`
   (repeat on the prod deployment before going live:
   `npx convex env set --prod ...`).
5. Verify: `npx convex env get CLERK_JWT_ISSUER_DOMAIN` prints the URL, and
   after `convex/auth.config.ts` is in place, `npx convex dev` logs no auth
   config errors.

When the app moves to a production Clerk instance (custom domain), the
issuer domain changes — update the Convex prod env var to match.

## Vercel

1. Sign up at https://vercel.com (GitHub login recommended — it enables
   auto-deploys from pushes).
2. `npm i -g vercel && vercel login`.
3. Link: `vercel link` in the project directory (or import the Git repo in
   the Vercel dashboard, which is the better long-term setup).
4. Configure the build (dashboard → Project → Settings → Build & Development):
   build command `npx convex deploy --cmd 'pnpm build'`. Then create a deploy
   key in the Convex dashboard (Settings → Deploy keys, production) and add
   it to Vercel env vars as `CONVEX_DEPLOY_KEY`.
5. Add the other frontend env vars to Vercel: `VITE_CLERK_PUBLISHABLE_KEY`,
   `VITE_VAPID_PUBLIC_KEY`.
6. Verify: `vercel whoami` succeeds and `.vercel/project.json` exists.

## VAPID keys (web push)

No account needed — it's just an ECDSA keypair:

```bash
npx web-push generate-vapid-keys
```

- Public key → `.env.local` as `VITE_VAPID_PUBLIC_KEY`, and the same value on
  Convex as `VAPID_PUBLIC_KEY`, and in Vercel env as `VITE_VAPID_PUBLIC_KEY`.
- Private key → Convex only: `npx convex env set VAPID_PRIVATE_KEY <key>`.
- Subject → `npx convex env set VAPID_SUBJECT mailto:you@example.com`.

Generate the pair **once per app** and never rotate casually: every stored
push subscription is bound to the public key, so rotating silently kills all
existing subscriptions.
