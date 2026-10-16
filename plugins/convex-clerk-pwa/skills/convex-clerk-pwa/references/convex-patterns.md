# Convex patterns for an installed PWA

Three backend rules that come from running this stack in production. Read
this before changing a schema, a validator, a delete/undo path, or a query
that fetches one document by id.

## 1. Every backend change must work with the previous client

An installed PWA keeps running the bundle it already has until its service
worker picks up the new build and reloads it. An open tab reloads within
about a minute. A home-screen app that was closed reloads only on its next
launch. Even with `convex deploy --cmd` keeping the two in lockstep, the new
functions will serve old clients for a while. If the functions deploy
separately from the frontend, that window starts before the frontend
deploys.

Make changes in two steps: expand the backend first, then contract it a
release later.

| Change | Safe way |
|---|---|
| New schema field | `v.optional(...)`. Existing rows lack it, and old clients never send it. |
| New argument | Optional, with the old behaviour when it's missing. |
| Retiring an enum value a client sends (e.g. a filter `module: "tasks"`) | Keep accepting the literal in the args validator and return an empty result, with a comment saying why. Drop it a release later. |
| Removing or renaming a function | Add the new one, ship the client that calls it, and remove the old one a release later. An old client calling a missing function throws. |
| Return shape | Adding fields is safe because old clients ignore them. Removing or retyping a field an old client reads is not. |
| Making a field required | Backfill first with an internal mutation, then tighten the validator. Convex rejects the schema push if any row fails. |

Before a release, check whether the backend changed at all:

```bash
git fetch origin
git log --oneline origin/main..origin/dev
git diff --stat origin/main origin/dev -- convex/
```

If the diff is empty, the release is frontend-only and needs no Convex
deploy.

## 2. Undo must restore denormalized "last_*" fields

Parents often cache a value from their newest child, for example
`cars.last_maintenance_mileage`, so lists don't have to scan the children.
Deleting the newest child must put the old value back. Recomputing it from
the remaining children fails when none remain: the original value came from
the parent's own baseline (set at creation), not from a child.

Snapshot the parent's value onto the child at insert time, and fall back to
that snapshot on delete:

```ts
// schema: child entries carry what they replaced
maintenance: v.array(v.object({
  date: v.string(),
  mileage: v.number(),
  // The car's last_maintenance_* before this entry, so undo can restore it.
  previous: v.optional(v.object({ date: v.string(), mileage: v.number() })),
})),

// add
const entry = { ...args, previous: { date: car.last_maintenance_date, mileage: car.last_maintenance_mileage } };

// delete
const remaining = car.maintenance.filter((_, i) => i !== args.index);
const latest =
  [...remaining].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ??
  car.maintenance[args.index].previous;
```

`previous` is optional (rule 1), so rows logged before the change still
fall back to the old behaviour.

Test it: create the parent with a baseline, add one child, undo it, and
assert the baseline is back. Also check any derived query that reads the
field (an odometer default, a "next due" date).

## 3. By-id reads return `null` for missing or foreign documents

A query that takes an id from the client, such as `getWorkout({ workout_id })`
behind a detail sheet, must check ownership. When the document is missing,
deleted, or belongs to someone else, it returns `null`. It doesn't throw:
the client renders `null` as "This was deleted.", and a thrown error would
crash the component through the error boundary. Ids show up in URLs and
logs, so never trust them.

```ts
export const getWorkout = query({
  args: { workout_id: v.id("workouts") },
  returns: v.union(v.null(), v.object({ /* ... */ })),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const workout = await ctx.db.get(args.workout_id);
    if (!workout || workout.user_id !== userId) return null;
    // ...
  },
});
```

Pair every such query with a `convex-test` test covering both the owner and
a stranger:

```ts
test("returns the workout to its owner and null to anyone else", async () => {
  const t = setupTest();
  const owner = await withTestUser(t);
  const stranger = await withTestUser(t);
  const id = await seedWorkout(owner.asUser);
  expect(await owner.asUser.query(api.workout.getWorkout, { workout_id: id })).not.toBeNull();
  expect(await stranger.asUser.query(api.workout.getWorkout, { workout_id: id })).toBeNull();
});
```

For date-dependent logic ("due today", "last 7 days"), pin the clock with
`vi.useFakeTimers(); vi.setSystemTime(...)` in `beforeEach`, and restore it
in `afterEach`.
