/**
 * SubscriptionPanel
 *
 * Displays subscription status and wallet connections.
 * Uses sigma-auth plugin for NFT-based subscription verification.
 */

import type {
	ConnectedWallet,
	SubscriptionStatus,
	SubscriptionTier,
} from '@sigma-auth/better-auth-plugin/client';
import { Crown, ExternalLink, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SIGMA_AUTH_URL } from '../../config/constants';
import type { RootState } from '../../store';

// Tier display configuration
const TIER_CONFIG: Record<SubscriptionTier, { label: string; color: string; icon: string }> = {
	free: { label: 'Free', color: 'bg-muted text-muted-foreground', icon: '' },
	plus: { label: 'Plus', color: 'bg-primary text-primary-foreground', icon: '' },
	pro: { label: 'Pro', color: 'bg-chart-3 text-primary-foreground', icon: '' },
	premium: { label: 'Premium', color: 'bg-chart-4 text-primary-foreground', icon: '' },
	enterprise: { label: 'Enterprise', color: 'bg-chart-2 text-primary-foreground', icon: '' },
};

export function SubscriptionPanel() {
	const session = useSelector((state: RootState) => state.session);
	const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
	const [wallets, setWallets] = useState<ConnectedWallet[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const accessToken = localStorage.getItem('sigma_access_token');
	const bapId = session.user?.idKey;

	// Fetch subscription status
	const fetchData = useCallback(async () => {
		if (!accessToken) return;

		setLoading(true);
		setError(null);

		try {
			// Fetch subscription status
			const subResponse = await fetch(`${SIGMA_AUTH_URL}/api/subscription/status`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (subResponse.ok) {
				const subData = await subResponse.json();
				setSubscription(subData);
			} else if (subResponse.status === 404) {
				// No BAP identity - set free tier
				setSubscription({ tier: 'free', isActive: false });
			}

			// Fetch connected wallets
			if (bapId) {
				const walletResponse = await fetch(
					`${SIGMA_AUTH_URL}/api/wallet/connect?bapId=${encodeURIComponent(bapId)}`,
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				);

				if (walletResponse.ok) {
					const walletData = await walletResponse.json();
					setWallets(walletData.wallets || []);
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load subscription');
			setSubscription({ tier: 'free', isActive: false });
		} finally {
			setLoading(false);
		}
	}, [accessToken, bapId]);

	useEffect(() => {
		if (session.isAuthenticated && accessToken) {
			fetchData();
		}
	}, [session.isAuthenticated, accessToken, fetchData]);

	// Not authenticated
	if (!session.isAuthenticated || !accessToken) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Crown className="h-5 w-5" />
						Subscription
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">Sign in to view your subscription status.</p>
				</CardContent>
			</Card>
		);
	}

	const tierConfig = TIER_CONFIG[subscription?.tier || 'free'];

	return (
		<div className="space-y-4">
			{/* Subscription Status Card */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Crown className="h-5 w-5" />
							Subscription
						</CardTitle>
						<Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
							<RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
						</Button>
					</div>
					<CardDescription>Your current plan and connected wallets</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{loading ? (
						<div className="flex items-center justify-center py-4">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : error ? (
						<p className="text-destructive text-sm">{error}</p>
					) : (
						<>
							{/* Current Tier */}
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Current Plan</span>
								<Badge className={tierConfig.color}>{tierConfig.label}</Badge>
							</div>

							{/* NFT Info */}
							{subscription?.nftOrigin && (
								<div className="text-xs text-muted-foreground">
									NFT: {subscription.nftOrigin.slice(0, 16)}...
								</div>
							)}

							{/* Upgrade Link */}
							{subscription?.tier === 'free' && (
								<Button
									variant="outline"
									size="sm"
									className="w-full"
									onClick={() => window.open('https://sigmaidentity.com/pricing', '_blank')}
								>
									<ExternalLink className="h-4 w-4 mr-2" />
									Upgrade Plan
								</Button>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Connected Wallets Card */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<Wallet className="h-4 w-4" />
						Connected Wallets
					</CardTitle>
					<CardDescription>Wallets linked to your identity for NFT verification</CardDescription>
				</CardHeader>
				<CardContent>
					{wallets.length === 0 ? (
						<div className="text-center py-4">
							<p className="text-muted-foreground text-sm mb-3">No wallets connected</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									window.open(
										`https://auth.sigmaidentity.com/account${bapId ? `/${bapId}` : ''}`,
										'_blank',
									)
								}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Connect Wallet
							</Button>
						</div>
					) : (
						<div className="space-y-2">
							{wallets.map((wallet) => (
								<div
									key={wallet.address}
									className="flex items-center justify-between p-2 rounded-md bg-muted/50"
								>
									<div className="flex items-center gap-2 min-w-0">
										<Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
										<span className="text-sm font-mono truncate">
											{wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
										</span>
									</div>
									<div className="flex items-center gap-2">
										{wallet.isPrimary && (
											<Badge variant="secondary" className="text-xs">
												Primary
											</Badge>
										)}
										<Badge variant="outline" className="text-xs">
											{wallet.provider}
										</Badge>
									</div>
								</div>
							))}
							<Button
								variant="ghost"
								size="sm"
								className="w-full mt-2"
								onClick={() =>
									window.open(
										`https://auth.sigmaidentity.com/account${bapId ? `/${bapId}` : ''}`,
										'_blank',
									)
								}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Manage Wallets
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default SubscriptionPanel;
