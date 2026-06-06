import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAccess } from '@/lib/use-access';

/** Gate for the app surface: must be signed in AND approved off the waitlist. */
export function RequireAccess({ children }: { children: ReactNode }) {
	const { loading, user, approved } = useAccess();

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center text-foreground">Loading…</div>
		);
	}
	if (!user) return <Navigate to="/login" replace />;
	if (!approved) return <Navigate to="/" replace />;
	return <>{children}</>;
}
