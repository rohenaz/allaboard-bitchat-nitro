import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { useAccess } from "@/lib/use-access";

type Loading = "email" | "signup" | "google" | "twitter" | null;

/**
 * Low-friction identity login (collects email). Sigma/wallet for on-chain
 * posting is configured separately, in-app.
 */
export function SignIn() {
  const navigate = useNavigate();
  const { providers } = useAccess();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<Loading>(null);
  const [error, setError] = useState<string | null>(null);

  async function emailAuth(mode: "email" | "signup") {
    if (loading) return;
    setLoading(mode);
    setError(null);
    const res =
      mode === "email"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            email,
            password,
            name: email.split("@")[0] || email,
          });
    if (res.error) {
      setError(res.error.message ?? "Something went wrong");
      setLoading(null);
      return;
    }
    navigate("/");
  }

  async function social(provider: "google" | "twitter") {
    if (loading) return;
    setLoading(provider);
    setError(null);
    const { error: err } = await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}/`,
    });
    if (err) {
      setError(err.message ?? `Could not connect to ${provider}`);
      setLoading(null);
    }
  }

  async function sigma() {
    if (loading) return;
    setLoading("sigma");
    setError(null);
    try {
      await authClient.signIn.sigma({
        clientId: import.meta.env.VITE_SIGMA_CLIENT_ID as string,
        callbackURL: "/auth/sigma/callback",
      });
    } catch {
      setError("Could not connect to Sigma Identity");
      setLoading(null);
    }
  }

  const sigmaEnabled = Boolean(import.meta.env.VITE_SIGMA_CLIENT_ID);
  const hasSocial = sigmaEnabled || providers.google || providers.twitter;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-foreground">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          Sign in to BitChat
        </h1>

        {error ? (
          <p className="text-center text-sm text-red-400">{error}</p>
        ) : null}

        {hasSocial ? (
          <div className="flex flex-col gap-2">
            {sigmaEnabled ? (
              <button
                type="button"
                onClick={sigma}
                disabled={loading !== null}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading === "sigma" ? "Connecting…" : "Sign in with Bitcoin (Sigma)"}
              </button>
            ) : null}
            {providers.google ? (
              <button
                type="button"
                onClick={() => social("google")}
                disabled={loading !== null}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                {loading === "google" ? "Connecting…" : "Continue with Google"}
              </button>
            ) : null}
            {providers.twitter ? (
              <button
                type="button"
                onClick={() => social("twitter")}
                disabled={loading !== null}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                {loading === "twitter" ? "Connecting…" : "Continue with X"}
              </button>
            ) : null}
            <div className="my-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            emailAuth("email");
          }}
          className="flex flex-col gap-3"
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading !== null}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading !== null}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading !== null}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading === "email" ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => emailAuth("signup")}
            disabled={loading !== null}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {loading === "signup"
              ? "Creating account…"
              : "New here? Create an account"}
          </button>
        </form>
      </div>
    </main>
  );
}
