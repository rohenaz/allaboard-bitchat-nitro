import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { sigmaCallbackPlugin } from "@sigma-auth/better-auth-plugin/server";
import { betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins/admin";
import authConfig from "./auth.config";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authSchema from "./betterAuth/schema";

// Returns "" instead of throwing — safe for module-load analysis (createApi in
// adapter.ts imports createAuthOptions before Convex env vars are available).
function env(name: string): string {
  return process.env[name] ?? "";
}
function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  { local: { schema: authSchema } },
);

// Social providers included only when configured (X = Better Auth `twitter`).
function socialProviders() {
  const p: Record<string, { clientId: string; clientSecret: string }> = {};
  if (env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET")) {
    p.google = {
      clientId: env("GOOGLE_CLIENT_ID"),
      clientSecret: env("GOOGLE_CLIENT_SECRET"),
    };
  }
  if (env("X_CLIENT_ID") && env("X_CLIENT_SECRET")) {
    p.twitter = {
      clientId: env("X_CLIENT_ID"),
      clientSecret: env("X_CLIENT_SECRET"),
    };
  }
  return p;
}

// Safe for module-load: never throws on missing env vars.
export function createAuthOptions(ctx?: GenericCtx<DataModel>) {
  const siteUrl = env("SITE_URL");
  return {
    // Cross-domain SPA: the auth server's own Convex .site URL (auto-provided),
    // with crossDomain handling the app origin.
    baseURL: env("CONVEX_SITE_URL"),
    secret: env("BETTER_AUTH_SECRET"),
    trustedOrigins: [
      siteUrl,
      "https://bitchatnitro.com",
      "https://www.bitchatnitro.com",
      env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : "",
      env("VERCEL_BRANCH_URL") ? `https://${env("VERCEL_BRANCH_URL")}` : "",
      "http://localhost:5173",
    ].filter(Boolean),
    database: ctx ? authComponent.adapter(ctx) : undefined,
    emailAndPassword: { enabled: true },
    socialProviders: socialProviders(),
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google", "twitter", "sigma"],
      },
    },
    plugins: [
      admin({ defaultRole: "user", adminRoles: ["admin"] }),
      sigmaCallbackPlugin(),
      crossDomain({ siteUrl }),
      convex({ authConfig }),
    ],
  };
}

// Request-time only: validates required env, then builds the auth instance.
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  must("BETTER_AUTH_SECRET");
  return betterAuth({
    ...createAuthOptions(ctx),
    database: authComponent.adapter(ctx),
  });
};

/** Current authenticated user (Convex query for the SPA). */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => authComponent.getAuthUser(ctx),
});
