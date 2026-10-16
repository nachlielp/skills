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

## Releasing through a dev → main flow

Many apps merge feature PRs into `dev` and then release `dev` → `main`. Before
opening the release PR:

1. Confirm every feature PR that should ship is actually merged into `dev`.
   Run `git log --oneline origin/main..origin/dev` to see what the release
   carries. If the release PR merges before a feature PR, `main` ships
   without that feature, and the feature needs a second release.
2. Run `git diff --stat origin/main origin/dev -- convex/`. If it's empty,
   the release is frontend-only.
3. If the build command doesn't deploy Convex (some apps run
   `npx convex deploy -y` by hand), deploy Convex **before** merging the
   release. That works because every backend change has to work with the
   previous client anyway (see `references/convex-patterns.md`). Deploying
   after the merge leaves the new frontend calling functions that don't
   exist yet.

## Automated production smoke test

`scripts/prod-smoke.mjs` checks a deploy without signing in. Production
holds real data, so signed-in checks happen locally with a test account.
Note the entry bundle prod serves before the merge, then run the script
after it:

```bash
curl -s https://<app>/ | grep -o 'assets/index-[^"]*\.js'   # before merging
node <skill-dir>/scripts/prod-smoke.mjs --url https://<app> \
  --old index-AbC123.js --convex <prod-deployment-name> \
  --marker "text only the new code contains" \
  --absent "text from code this release removed" \
  --css-marker ".sheet>*{flex-shrink:0}" \
  --path /some/deep/route --expect-text "Sign in"
```

The script:
- waits for the bundle hash to change, then walks every lazy-loaded chunk
  for the markers,
- checks that deep links serve the SPA shell,
- loads the page at phone width and checks for console errors, failed
  requests and horizontal overflow,
- waits up to 20s for the service worker to become active.

Choose markers from strings that survive minification, such as user-visible
copy or CSS selectors. Before trusting a CSS marker, confirm its minified
form with a local build: `vite build --outDir /tmp/check`, then `grep` the
CSS. Minifiers drop spaces, for example `.a > *` becomes `.a>*`.

## Post-deploy acceptance test

1. `curl -sI https://<app>/sw.js | grep -i cache-control` → must show `no-cache`.
2. Open the app, sign in, note the footer version.
3. Push a trivial commit; after the deploy finishes, the already-open tab
   should reload itself within ~60s and show the new version.
4. Install to a phone home screen, enable notifications, trigger a test push
   with the app closed.
