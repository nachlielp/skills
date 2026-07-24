# Deploying to Vercel

## Project settings

- Framework preset: Vite. Output directory: `dist`.
- **Build command: `npx convex deploy --cmd 'pnpm build'`** — this is the
  load-bearing setting. It (1) pushes the `convex/` functions to the
  production deployment, (2) injects the production `VITE_CONVEX_URL` into
  the frontend build, and (3) only then builds the frontend. Frontend and
  backend therefore can never skew: the deployed bundle always talks to the
  matching function version.
- Connect the Git repo so pushes to the production branch auto-deploy;
  every other branch gets a preview URL (previews still point at the
  production Convex deployment unless you configure preview deploy keys —
  fine for a personal app, worth knowing).

## Vercel environment variables

| Var | Value |
|---|---|
| `CONVEX_DEPLOY_KEY` | Convex dashboard → Settings → Deploy keys → generate (production) |
| `VITE_CLERK_PUBLISHABLE_KEY` | from Clerk dashboard (prod instance key when you have one) |
| `VITE_VAPID_PUBLIC_KEY` | same public key as in `.env.local` |

(`VITE_CONVEX_URL` is *not* set manually — `convex deploy --cmd` provides it.)

Server-side secrets (`VAPID_PRIVATE_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, …) do
NOT go in Vercel — they live in the Convex **production** deployment env:
`npx convex env set --prod NAME value`.

## vercel.json

Copy the template as-is. It carries the SPA rewrite (all extensionless paths
→ `/index.html`) and the cache headers the PWA update system depends on
(`sw.js` and `index.html` `no-cache`, hashed `/assets/*` immutable). See
`references/pwa-versioning.md` for why removing any header reintroduces the
stale-build bug.

## Post-deploy acceptance test

1. `curl -sI https://<app>/sw.js | grep -i cache-control` → must show `no-cache`.
2. Open the app, sign in, note the footer version.
3. Push a trivial commit; after the deploy finishes, the already-open tab
   should reload itself within ~60s and show the new version.
4. Install to a phone home screen, enable notifications, trigger a test push
   with the app closed.
