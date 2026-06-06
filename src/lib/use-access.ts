import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { authClient } from './auth-client';
import { useWaitlistMode } from './use-flags';

/**
 * App access state for the gate + landing. Combines the better-auth session,
 * the `waitlist-mode` Vercel Flag, and the user's waitlist status.
 *   approved = signed in AND (admin OR waitlist-off OR invited/admitted/signed_up)
 */
export function useAccess() {
	const { data: session, isPending } = authClient.useSession();
	const waitlistModeFlag = useWaitlistMode(); // undefined while loading
	const config = useQuery(api.waitlist.config); // provider availability
	const email = session?.user?.email ?? null;
	const wl = useQuery(api.waitlist.status, email ? { email } : 'skip');

	const isAdmin = (session?.user as { role?: string | null } | undefined)?.role === 'admin';
	const waitlistMode = waitlistModeFlag ?? true;
	const loading =
		isPending ||
		waitlistModeFlag === undefined ||
		config === undefined ||
		(!!email && wl === undefined);
	const approved = !!session?.user && (isAdmin || !waitlistMode || Boolean(wl?.approved));

	return {
		loading,
		user: session?.user ?? null,
		isAdmin,
		waitlistMode,
		providers: config?.providers ?? { google: false, twitter: false },
		approved,
		onWaitlist: !!wl,
		position: wl?.position ?? null,
		total: wl?.total ?? null,
	};
}
