# Clerk + Convex integration

Three pieces must agree for auth to work end-to-end. All three reference the
literal string `"convex"` — the Clerk JWT template name, the `applicationID`
in the Convex auth config, and (implicitly) the token Convex requests from
Clerk. If sign-in works but `ctx.auth.getUserIdentity()` returns `null`, one
of the three is out of sync.

## 1. Clerk dashboard: JWT template

Configure → JWT Templates → New template → **Convex** (built-in preset).
Keep the name `convex`. Note the **Issuer** URL — that's the
`CLERK_JWT_ISSUER_DOMAIN`.

## 2. Convex: auth config

`convex/auth.config.ts` (template: `assets/templates/convex/auth.config.ts`):

```ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

Set the env var on the deployment (NOT in `.env.local` — this is read by the
Convex server, not Vite):

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-issuer>.clerk.accounts.dev
```

`npx convex dev` must be restarted/running to pick up auth config changes.

## 3. Frontend: provider nesting

`ConvexProviderWithClerk` comes from `convex/react-clerk` and must sit
*inside* `ClerkProvider`, receiving Clerk's `useAuth`:

```tsx
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    <App />
  </ConvexProviderWithClerk>
</ClerkProvider>
```

(The `main.tsx` template already has this, plus the service-worker
registration block.)

## Gating UI on auth state

Use Convex's components, not Clerk's, to gate anything that renders Convex
data — Clerk's `SignedIn` fires before the Convex websocket has
authenticated, so queries would briefly run unauthenticated:

```tsx
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";

<AuthLoading>spinner…</AuthLoading>
<Unauthenticated><SignInButton mode="modal" /></Unauthenticated>
<Authenticated><UserButton /> …app…</Authenticated>
```

## Using the identity in Convex functions

```ts
const identity = await ctx.auth.getUserIdentity();
if (identity === null) throw new Error("Not authenticated");
// identity.subject — stable Clerk user id; use it as the user key
// identity.email, identity.name, identity.pictureUrl — profile fields
```

Store app-side user records keyed by `identity.subject` (a `v.string()`
column named e.g. `clerk_user_id`, with an index). A common pattern is an
`users.upsertFromClerk` mutation called once from a `useEffect` after
`Authenticated` mounts, which inserts-or-patches the profile fields.

## Pitfalls

- `getUserIdentity()` returns `null` in functions called before the client
  finished authenticating — gate with `<Authenticated>` (above) rather than
  treating it as a server bug.
- Dev and prod Convex deployments each need `CLERK_JWT_ISSUER_DOMAIN` set
  separately; prod typically uses a different Clerk instance (and issuer).
- Don't install `@clerk/clerk-sdk-node` or the secret key — nothing in this
  stack calls Clerk's backend API; Convex verifies the JWT locally against
  the issuer's JWKS.
