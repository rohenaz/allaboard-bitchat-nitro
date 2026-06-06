import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// App tables (Better Auth tables live in the betterAuth component).
const schema = defineSchema({
  // Pre-launch waitlist. Status lifecycle mirrors Minerva:
  //   pending   — joined, no invite yet
  //   invited   — admin sent an invite
  //   admitted  — invite accepted (may sign up)
  //   signed_up — account created
  waitlist: defineTable({
    email: v.string(), // stored lowercased
    source: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("invited"),
      v.literal("admitted"),
      v.literal("signed_up"),
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    invitedAt: v.optional(v.number()),
    admittedAt: v.optional(v.number()),
    signedUpAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("status", ["status"]),
});

export default schema;
