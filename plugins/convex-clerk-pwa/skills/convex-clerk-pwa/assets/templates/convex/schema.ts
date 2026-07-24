import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // App user record, created/refreshed on sign-in. Keyed by Clerk's stable
  // user id (identity.subject).
  users: defineTable({
    clerk_user_id: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_clerk_user_id", ["clerk_user_id"]),

  // One row per browser/device that enabled push. Deduped by endpoint;
  // pruned when the push service reports the subscription dead (404/410).
  push_subscriptions: defineTable({
    user_id: v.string(), // Clerk subject
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    created_at: v.string(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_endpoint", ["endpoint"]),

  // ... app tables go here. Conventions: snake_case fields, an index for
  // every access pattern (never .filter() over a full table).
});
