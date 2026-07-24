"use node";

// Web Push sender. Must live in a "use node" file because the web-push
// package needs Node; such files can only export actions, which is why the
// queries/mutations live in push.ts.

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import webpush from "web-push";

// Send a push to every device the user has subscribed. Call directly from
// other functions (ctx.runAction) or schedule it (ctx.scheduler.runAfter) —
// scheduling is what makes notifications fire while the app is closed.
export const sendToUser = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    tag: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      console.error(
        "Missing VAPID env vars (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT)"
      );
      return null;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subscriptions = await ctx.runQuery(
      internal.push.getSubscriptionsForUser,
      { userId: args.userId }
    );

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      tag: args.tag,
      url: args.url,
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          // Time-sensitive default: deliver promptly, drop if the device
          // stays unreachable — a stale alert arriving hours later is worse
          // than none. Loosen TTL for digest-style content.
          { TTL: 300, urgency: "high" }
        );
      } catch (error: any) {
        // 404/410 mean the subscription is gone — prune it.
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await ctx.runMutation(internal.push.deleteSubscriptionById, {
            id: sub._id,
          });
        } else {
          console.error("Web push failed:", error?.statusCode, error?.body);
        }
      }
    }

    return null;
  },
});
