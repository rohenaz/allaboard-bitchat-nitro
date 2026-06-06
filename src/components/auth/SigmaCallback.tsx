import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

/** Completes the Sigma (Bitcoin) better-auth flow, then returns to the app. */
export function SigmaCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      try {
        const params = Object.fromEntries(
          new URLSearchParams(window.location.search),
        );
        await authClient.sigma.handleCallback(params);
      } catch {
        // fall through to the landing, which will show the right state
      }
      navigate("/", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center text-foreground">
      Finishing sign-in…
    </div>
  );
}
