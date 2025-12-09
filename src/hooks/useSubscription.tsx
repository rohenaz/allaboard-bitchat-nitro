/**
 * useSubscription Hook
 *
 * Provides subscription status and feature gating for NFT-based subscriptions.
 * Uses sigma-auth plugin for verification.
 */

import type { SubscriptionStatus, SubscriptionTier } from "@sigma-auth/better-auth-plugin/client";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { SIGMA_AUTH_URL } from "../config/constants";
import type { RootState } from "../store";

// Feature to minimum tier mapping
const FEATURE_TIERS: Record<string, SubscriptionTier> = {
	"custom-channels": "plus",
	"unlimited-messages": "pro",
	"file-uploads-large": "plus",
	"analytics": "pro",
	"priority-support": "pro",
	"custom-themes": "plus",
};

// Tier priority for comparison
const TIER_PRIORITY: Record<SubscriptionTier, number> = {
	free: 0,
	plus: 1,
	pro: 2,
	premium: 3,
	enterprise: 4,
};

interface UseSubscriptionResult {
	subscription: SubscriptionStatus | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	hasTier: (tier: SubscriptionTier) => boolean;
	canAccess: (feature: string) => boolean;
	tier: SubscriptionTier;
}

export function useSubscription(): UseSubscriptionResult {
	const session = useSelector((state: RootState) => state.session);
	const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const accessToken = typeof window !== "undefined"
		? localStorage.getItem("sigma_access_token")
		: null;

	const fetchSubscription = useCallback(async () => {
		if (!accessToken) {
			setSubscription({ tier: "free", isActive: false });
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`${SIGMA_AUTH_URL}/api/subscription/status`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (response.ok) {
				const data = await response.json();
				setSubscription(data);
			} else if (response.status === 401) {
				// Token expired or invalid
				setError("Session expired");
				setSubscription({ tier: "free", isActive: false });
			} else if (response.status === 404) {
				// No BAP identity
				setSubscription({ tier: "free", isActive: false });
			} else {
				throw new Error("Failed to fetch subscription status");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			setSubscription({ tier: "free", isActive: false });
		} finally {
			setLoading(false);
		}
	}, [accessToken]);

	// Fetch on mount and auth change
	useEffect(() => {
		if (session.isAuthenticated) {
			fetchSubscription();
		} else {
			setSubscription({ tier: "free", isActive: false });
		}
	}, [session.isAuthenticated, fetchSubscription]);

	// Check if user has at least the specified tier
	const hasTier = useCallback(
		(requiredTier: SubscriptionTier): boolean => {
			const currentTier = subscription?.tier || "free";
			return TIER_PRIORITY[currentTier] >= TIER_PRIORITY[requiredTier];
		},
		[subscription]
	);

	// Check if user can access a specific feature
	const canAccess = useCallback(
		(feature: string): boolean => {
			const requiredTier = FEATURE_TIERS[feature];
			if (!requiredTier) return true; // Unknown features are accessible
			return hasTier(requiredTier);
		},
		[hasTier]
	);

	return {
		subscription,
		loading,
		error,
		refresh: fetchSubscription,
		hasTier,
		canAccess,
		tier: subscription?.tier || "free",
	};
}

/**
 * Feature gate component - renders children only if user has access
 */
export function FeatureGate({
	feature,
	tier,
	children,
	fallback,
}: {
	feature?: string;
	tier?: SubscriptionTier;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	const { canAccess, hasTier } = useSubscription();

	const hasAccess = feature ? canAccess(feature) : tier ? hasTier(tier) : true;

	if (!hasAccess) {
		return fallback || null;
	}

	return <>{children}</>;
}
