import { v } from "convex/values";
import { authComponent } from "./auth";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const STATUS = v.union(
  v.literal("pending"),
  v.literal("invited"),
  v.literal("admitted"),
  v.literal("signed_up"),
);

// Statuses that grant app access (admin approved / invite accepted / signed up).
const APPROVED = new Set(["invited", "admitted", "signed_up"]);

async function pendingPlace(ctx: QueryCtx, createdAt: number) {
  const pending = await ctx.db
    .query("waitlist")
    .withIndex("status", (q) => q.eq("status", "pending"))
    .collect();
  const ahead = pending.filter((e) => e.createdAt < createdAt).length;
  return { position: ahead + 1, total: pending.length };
}

async function requireAdmin(ctx: QueryCtx) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user || (user as { role?: string | null }).role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

/** Public: join the waitlist (idempotent). Returns status + place in line. */
export const join = mutation({
  args: { email: v.string(), source: v.optional(v.string()) },
  handler: async (ctx, { email, source }) => {
    const e = email.toLowerCase().trim();
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("email", (q) => q.eq("email", e))
      .unique();
    if (existing) {
      const place =
        existing.status === "pending"
          ? await pendingPlace(ctx, existing.createdAt)
          : { position: null, total: null };
      return { status: "already" as const, ...place };
    }
    const createdAt = Date.now();
    await ctx.db.insert("waitlist", {
      email: e,
      source: source ?? "landing",
      status: "pending",
      createdAt,
    });
    return { status: "joined" as const, ...(await pendingPlace(ctx, createdAt)) };
  },
});

/** Public: a single email's waitlist status + place. */
export const status = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const e = email.toLowerCase().trim();
    const entry = await ctx.db
      .query("waitlist")
      .withIndex("email", (q) => q.eq("email", e))
      .unique();
    if (!entry) return null;
    const place =
      entry.status === "pending"
        ? await pendingPlace(ctx, entry.createdAt)
        : { position: null, total: null };
    return { status: entry.status, approved: APPROVED.has(entry.status), ...place };
  },
});

/**
 * Public: which social providers are configured (so the login UI only shows
 * working buttons). The waitlist-mode gate is a Vercel Flag (see /api/flags),
 * not a Convex env.
 */
export const config = query({
  args: {},
  handler: async () => ({
    providers: {
      google: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      ),
      twitter: Boolean(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET),
    },
  }),
});

/** Admin: list entries (optionally filtered by status). */
export const list = query({
  args: { status: v.optional(STATUS) },
  handler: async (ctx, { status: filter }) => {
    await requireAdmin(ctx);
    const rows = filter
      ? await ctx.db
          .query("waitlist")
          .withIndex("status", (q) => q.eq("status", filter))
          .collect()
      : await ctx.db.query("waitlist").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const pending = rows
      .filter((r) => r.status === "pending")
      .sort((a, b) => a.createdAt - b.createdAt);
    const pos = new Map(pending.map((r, i) => [r._id, i + 1]));
    return {
      rows: rows.map((r) => ({
        id: r._id,
        email: r.email,
        status: r.status,
        source: r.source,
        createdAt: r.createdAt,
        position: r.status === "pending" ? (pos.get(r._id) ?? null) : null,
      })),
      stats: {
        pending: rows.filter((r) => r.status === "pending").length,
        invited: rows.filter((r) => r.status === "invited").length,
        admitted: rows.filter((r) => r.status === "admitted").length,
        signed_up: rows.filter((r) => r.status === "signed_up").length,
      },
    };
  },
});

/** Admin: mark an entry invited. */
export const invite = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    await requireAdmin(ctx);
    const e = email.toLowerCase().trim();
    const entry = await ctx.db
      .query("waitlist")
      .withIndex("email", (q) => q.eq("email", e))
      .unique();
    if (!entry) throw new Error("Not found");
    await ctx.db.patch(entry._id, { status: "invited", invitedAt: Date.now() });
    return { ok: true };
  },
});
