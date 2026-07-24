import { mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Resolve the calling user's Clerk id, or throw.
async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) throw new Error("Not authenticated");
  return identity.subject;
}

// Store (or refresh) the current user's Web Push subscription. Deduped by the
// push endpoint so re-subscribing on the same device updates in place.
export const savePushSubscription = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const existing = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        user_id: userId,
        p256dh: args.p256dh,
        auth: args.auth,
      });
      return null;
    }

    await ctx.db.insert("push_subscriptions", {
      user_id: userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      created_at: new Date().toISOString(),
    });
    return null;
  },
});

// Remove a subscription when the client unsubscribes.
export const deletePushSubscription = mutation({
  args: { endpoint: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

// --- Internal helpers used by the Node action in pushNode.ts ---

export const getSubscriptionsForUser = internalQuery({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("push_subscriptions"),
      endpoint: v.string(),
      p256dh: v.string(),
      auth: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .collect();
    return subs.map((s) => ({
      _id: s._id,
      endpoint: s.endpoint,
      p256dh: s.p256dh,
      auth: s.auth,
    }));
  },
});

export const deleteSubscriptionById = internalMutation({
  args: { id: v.id("push_subscriptions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Example scheduling pattern — a mutation that schedules a push for later
// and returns the scheduled-function id so the client can cancel it:
//
// export const scheduleReminder = mutation({
//   args: { delaySeconds: v.number(), body: v.string() },
//   returns: v.id("_scheduled_functions"),
//   handler: async (ctx, args) => {
//     const userId = await requireUserId(ctx);
//     return await ctx.scheduler.runAfter(
//       args.delaySeconds * 1000,
//       internal.pushNode.sendToUser,
//       { userId, title: "Reminder", body: args.body, tag: "reminder" }
//     );
//   },
// });
// export const cancelReminder = mutation({
//   args: { scheduledId: v.id("_scheduled_functions") },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     await ctx.scheduler.cancel(args.scheduledId);
//     return null;
//   },
// });
