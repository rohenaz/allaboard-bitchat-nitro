import { useMutation } from "convex/react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { useAccess } from "@/lib/use-access";

const TAGLINE = "BitChat — on-chain chat. Invite-only while we roll out.";

export function Landing() {
  const { loading, user, approved, waitlistMode, onWaitlist, position, total } =
    useAccess();
  const join = useMutation(api.waitlist.join);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{
    position: number | null;
    total: number | null;
    already: boolean;
  } | null>(null);

  if (loading) {
    return (
      <Shell>
        <p className="text-muted-foreground">Loading…</p>
      </Shell>
    );
  }

  // Approved → into the app.
  if (approved) return <Navigate to="/channels" replace />;

  async function submit(value: string) {
    if (busy || !value) return;
    setBusy(true);
    try {
      const res = await join({ email: value, source: "landing" });
      setDone({
        position: res.position ?? null,
        total: res.total ?? null,
        already: res.status === "already",
      });
    } finally {
      setBusy(false);
    }
  }

  // Signed in but not approved.
  if (user) {
    const place = done ?? (onWaitlist ? { position, total, already: true } : null);
    if (place?.position) {
      return (
        <Shell>
          <Badge>You're on the waitlist</Badge>
          <p className="text-6xl font-semibold tabular-nums">#{place.position}</p>
          <p className="text-balance text-muted-foreground">
            {place.total && place.total > 1
              ? `You're #${place.position} of ${place.total} in line.`
              : "You're first in line."}{" "}
            We'll email <span className="text-foreground">{user.email}</span> when
            it's your turn.
          </p>
          <SignOut />
        </Shell>
      );
    }
    return (
      <Shell>
        <Badge>Almost there</Badge>
        <p className="text-balance text-muted-foreground">
          Signed in as <span className="text-foreground">{user.email}</span>.
          Access is invite-only right now — save your spot.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => submit(user.email ?? "")}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Joining…" : "Join the waitlist"}
        </button>
        <SignOut />
      </Shell>
    );
  }

  // Anonymous, app open (waitlist off) — shouldn't usually render (approved
  // path handles signed-in), but anon with waitlist off → prompt sign in.
  if (!waitlistMode) {
    return (
      <Shell>
        <p className="text-balance text-muted-foreground">{TAGLINE}</p>
        <Link
          to="/login"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Sign in
        </Link>
      </Shell>
    );
  }

  // Anonymous, waitlist on → join form + sign in link.
  return (
    <Shell>
      <Badge>Coming soon</Badge>
      <p className="text-balance text-muted-foreground">{TAGLINE}</p>
      {done ? (
        <p className="text-balance text-foreground">
          {done.already ? "You're already on the list." : "You're on the list."}
          {done.position
            ? ` You're #${done.position}${done.total ? ` of ${done.total}` : ""} in line.`
            : ""}
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(email.trim());
          }}
          className="flex w-full max-w-md gap-2"
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Joining…" : "Join waitlist"}
          </button>
        </form>
      )}
      <Link
        to="/login"
        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Already have access? Sign in
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center text-foreground">
      <h1 className="text-4xl font-semibold tracking-tight">BitChat</h1>
      {children}
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function SignOut() {
  return (
    <button
      type="button"
      onClick={() => {
        import("@/lib/auth-client").then(({ authClient }) => {
          authClient.signOut().finally(() => {
            window.location.href = "/";
          });
        });
      }}
      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Not you? Sign out
    </button>
  );
}
