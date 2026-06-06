import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { useAccess } from '@/lib/use-access';

type Account = { providerId?: string; provider?: string };
const LABEL: Record<string, string> = {
	credential: 'Email & password',
	google: 'Google',
	twitter: 'X',
	sigma: 'Sigma',
};

export function Settings() {
	const { loading, user } = useAccess();
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [cur, setCur] = useState('');
	const [next, setNext] = useState('');
	const [busy, setBusy] = useState(false);
	const [msg, setMsg] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		const { data } = await authClient.listAccounts();
		setAccounts((data as Account[]) ?? []);
	}, []);
	useEffect(() => {
		if (user) refresh();
	}, [user, refresh]);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center text-foreground">Loading…</div>
		);
	}
	if (!user) return <Navigate to="/login" replace />;

	const pid = (a: Account) => a.providerId ?? a.provider ?? '';
	const connected = new Set(accounts.map(pid));
	const total = accounts.length;

	async function changePassword(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setMsg(null);
		const { error } = await authClient.changePassword({
			currentPassword: cur,
			newPassword: next,
		});
		setMsg(error ? (error.message ?? 'Could not change password') : 'Password updated.');
		if (!error) {
			setCur('');
			setNext('');
		}
		setBusy(false);
	}

	async function connect(provider: 'google' | 'twitter') {
		await authClient.signIn.social({ provider, callbackURL: `${window.location.origin}/settings` });
	}
	async function disconnect(provider: string) {
		if (total <= 1) {
			setMsg("Can't remove your only sign-in method.");
			return;
		}
		const { error } = await authClient.unlinkAccount({ providerId: provider });
		if (!error) refresh();
	}

	return (
		<main className="mx-auto w-full max-w-lg px-6 py-12 text-foreground">
			<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
			<p className="mt-2 text-sm text-muted-foreground">{user.email}</p>

			{msg ? <p className="mt-4 text-sm text-muted-foreground">{msg}</p> : null}

			<section className="mt-8">
				<h2 className="text-sm font-medium text-muted-foreground">Change password</h2>
				<form onSubmit={changePassword} className="mt-3 flex flex-col gap-3">
					<input
						type="password"
						placeholder="Current password"
						value={cur}
						onChange={(e) => setCur(e.target.value)}
						disabled={busy}
						className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
					/>
					<input
						type="password"
						placeholder="New password (min 8)"
						minLength={8}
						value={next}
						onChange={(e) => setNext(e.target.value)}
						disabled={busy}
						className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
					/>
					<button
						type="submit"
						disabled={busy}
						className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
					>
						{busy ? 'Saving…' : 'Update password'}
					</button>
				</form>
			</section>

			<section className="mt-10">
				<h2 className="text-sm font-medium text-muted-foreground">Connected accounts</h2>
				<div className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border">
					{(['credential', 'google', 'twitter'] as const).map((p) => {
						const isConn = connected.has(p);
						return (
							<div key={p} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
								<span>
									{LABEL[p]}
									{isConn ? <span className="ml-2 text-xs text-emerald-400">Connected</span> : null}
								</span>
								{p === 'credential' ? null : isConn ? (
									<button
										type="button"
										onClick={() => disconnect(p)}
										disabled={total <= 1}
										className="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50"
									>
										Disconnect
									</button>
								) : (
									<button
										type="button"
										onClick={() => connect(p)}
										className="rounded-md border border-border px-3 py-1 text-xs"
									>
										Connect
									</button>
								)}
							</div>
						);
					})}
				</div>
			</section>
		</main>
	);
}
