import { useEffect, useState } from "react";

/**
 * Reads the `waitlist-mode` Vercel Flag from the /api/flags function (the flag
 * is resolved server-side there). undefined = still loading. Defaults to gated
 * (true) if the endpoint is unavailable (e.g. local `vite` without functions —
 * use `vercel dev` to exercise it locally).
 */
export function useWaitlistMode(): boolean | undefined {
  const [waitlistMode, setWaitlistMode] = useState<boolean | undefined>(
    undefined,
  );
  useEffect(() => {
    let cancelled = false;
    fetch("/api/flags")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setWaitlistMode(d["waitlist-mode"] !== false);
      })
      .catch(() => {
        if (!cancelled) setWaitlistMode(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return waitlistMode;
}
