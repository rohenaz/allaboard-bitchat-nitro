import { flagsClient } from "@vercel/flags-core";

// Vercel Function: resolves feature flags server-side (reads the FLAGS SDK key)
// and exposes them to the SPA — same Vercel Flags system as Minerva, toggled
// per-environment via `vercel flags enable/disable -e <env>`.
export const GET = async () => {
  let waitlistMode = true; // safe default: gated until proven otherwise
  try {
    const v = await flagsClient.evaluate<boolean>("waitlist-mode");
    if (typeof v === "boolean") waitlistMode = v;
  } catch {
    // FLAGS key not set / flag missing → keep the safe default (gated).
  }
  return Response.json(
    { "waitlist-mode": waitlistMode },
    { headers: { "cache-control": "no-store" } },
  );
};
