import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// The better-auth server runs ON Convex; the SPA talks to it cross-domain at the
// Convex `.site` URL. crossDomainClient + convexClient handle that transport.
// (Sigma is the on-chain identity layer via the existing wallet flow — not a
// better-auth login method here.)
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL as string,
  plugins: [crossDomainClient(), convexClient(), adminClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
