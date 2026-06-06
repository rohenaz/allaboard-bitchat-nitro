import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAccess } from '@/lib/use-access';
import { api } from '../../../convex/_generated/api';

const STATUSES = ['pending', 'invited', 'admitted', 'signed_up'] as const;

export function WaitlistAdmin() {
	const { loading, isAdmin } = useAccess();
	const [filter, setFilter] = useState<(typeof STATUSES)[number] | undefined>(undefined);
	const data = useQuery(api.waitlist.list, isAdmin ? { status: filter } : 'skip');
	const invite = useMutation(api.waitlist.invite);
	const [inviting, setInviting] = useState<string | null>(null);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center text-foreground">Loading…</div>
		);
	}
	if (!isAdmin) return <Navigate to="/" replace />;

	const stats = data?.stats;
	const rows = data?.rows ?? [];

	async function onInvite(email: string) {
		setInviting(email);
		try {
			await invite({ email });
		} finally {
			setInviting(null);
		}
	}

	return (
		<main className="mx-auto w-full max-w-4xl px-6 py-12 text-foreground">
			<h1 className="text-2xl font-semibold tracking-tight">Waitlist</h1>

			<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
				{STATUSES.map((s) => (
					<div key={s} className="rounded-lg border border-border px-4 py-3">
						<p className="text-2xl font-semibold tabular-nums">{stats?.[s] ?? 0}</p>
						<p className="text-xs text-muted-foreground">{s}</p>
					</div>
				))}
			</div>

			<div className="mt-6 flex flex-wrap gap-2">
				{(['', ...STATUSES] as const).map((s) => (
					<button
						type="button"
						key={s || 'all'}
						onClick={() => setFilter(s === '' ? undefined : (s as (typeof STATUSES)[number]))}
						className={`rounded-md border border-border px-3 py-1 text-sm ${
							(s === '' ? undefined : s) === filter ? 'bg-primary text-primary-foreground' : ''
						}`}
					>
						{s || 'all'}
					</button>
				))}
			</div>

			<div className="mt-6 overflow-x-auto rounded-lg border border-border">
				<table className="w-full text-sm">
					<thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
						<tr>
							<th className="px-4 py-2 font-medium">#</th>
							<th className="px-4 py-2 font-medium">Email</th>
							<th className="px-4 py-2 font-medium">Status</th>
							<th className="px-4 py-2 font-medium">Joined</th>
							<th className="px-4 py-2 text-right font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.id} className="border-b border-border last:border-0">
								<td className="px-4 py-2 tabular-nums text-muted-foreground">
									{r.position ?? '—'}
								</td>
								<td className="px-4 py-2">{r.email}</td>
								<td className="px-4 py-2">{r.status}</td>
								<td className="px-4 py-2 text-muted-foreground">
									{new Date(r.createdAt).toLocaleDateString()}
								</td>
								<td className="px-4 py-2 text-right">
									{r.status === 'pending' || r.status === 'invited' ? (
										<button
											type="button"
											disabled={inviting === r.email}
											onClick={() => onInvite(r.email)}
											className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
										>
											{inviting === r.email
												? 'Inviting…'
												: r.status === 'invited'
													? 'Re-invite'
													: 'Invite'}
										</button>
									) : null}
								</td>
							</tr>
						))}
						{data && rows.length === 0 ? (
							<tr>
								<td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
									No entries
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
		</main>
	);
}
