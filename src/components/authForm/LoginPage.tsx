import { Loader2 } from 'lucide-react';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SocialProfile as BaseSocialProfile } from 'yours-wallet-provider';
import { useYoursWallet } from 'yours-wallet-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { NITRO_API_URL } from '../../config/constants';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useAppDispatch } from '../../hooks';
import { sigmaAuth } from '../../lib/auth';
import { loadChannels } from '../../reducers/channelsReducer';
import { setSigmaUser, setYoursUser } from '../../reducers/sessionReducer';
import HandcashIcon from '../icons/HandcashIcon';
import YoursIcon from '../icons/YoursIcon';

interface ExtendedProfile extends BaseSocialProfile {
	paymail?: string;
	displayName: string;
	avatar: string;
}

export const LoginPage: FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { isReady, isConnected, connect, getSocialProfile: getWalletProfile } = useYoursWallet();
	const { getSocialProfile, getAddresses } = useYours();
	const { setAuthToken, profile, getProfile } = useHandcash();
	const [error, setError] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [pandaAuth, setPandaAuth] = useState(false);
	const [checkingSession, setCheckingSession] = useState(true);

	// Check for existing sigma-auth session on component mount
	useEffect(() => {
		const checkExistingSession = async () => {
			try {
				const isAuthenticated = await sigmaAuth.isAuthenticated();
				if (isAuthenticated) {
					const currentUser = await sigmaAuth.getCurrentUser();
					if (currentUser) {
						dispatch(setSigmaUser(currentUser));
						await dispatch(loadChannels());
						navigate('/channels/nitro');
						return;
					}
				}
			} catch (error) {
				console.error('Error checking existing session:', error);
				await sigmaAuth.clearSession();
			} finally {
				setCheckingSession(false);
			}
		};

		checkExistingSession();
	}, [dispatch, navigate]);

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		if (searchParams.has('authToken')) {
			const token = searchParams.get('authToken');
			if (token) {
				setAuthToken(token);
				getProfile();
			}
		}
	}, [getProfile, setAuthToken]);

	useEffect(() => {
		if (profile || pandaAuth) {
			dispatch(loadChannels()).then(() => {
				navigate('/channels/nitro');
			});
		}
	}, [dispatch, navigate, profile, pandaAuth]);

	const handleHandcashLogin = () => {
		window.location.href = `${NITRO_API_URL}/hcLogin`;
	};

	const handleSigmaLogin = () => {
		try {
			setError('');
			setIsLoading(true);
			sigmaAuth.authorize();
		} catch (error) {
			console.error('Error initiating sigma-auth login:', error);
			setError('Failed to start authentication. Please try again.');
			setIsLoading(false);
		}
	};

	const handleYoursLogin = async () => {
		try {
			setError('');
			setIsLoading(true);

			if (!isReady) {
				window.open(
					'https://chromewebstore.google.com/detail/yours-wallet/mlbnicldlpdimbjdcncnklfempedeipj',
					'_blank',
				);
				return;
			}

			const connected = await isConnected();
			if (!connected) {
				await connect();
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			const isNowConnected = await isConnected();
			if (!isNowConnected) {
				throw new Error('Failed to connect to Yours wallet. Please try again.');
			}

			let profile: ExtendedProfile | null = null;
			let addresses = null;

			try {
				const walletProfile = await getWalletProfile();
				if (walletProfile?.displayName) {
					profile = walletProfile as ExtendedProfile;
				}
			} catch (_err) {
				// Ignore error and try next method
			}

			if (!profile?.paymail) {
				const contextProfile = await getSocialProfile();
				if (contextProfile?.displayName) {
					profile = contextProfile as ExtendedProfile;
				}
			}

			addresses = await getAddresses();

			if (!profile?.paymail) {
				const displayName = profile?.displayName || 'Anonymous';
				const safeName = displayName
					.toLowerCase()
					.replace(/[^a-z0-9]/g, '')
					.slice(0, 10);
				const randomSuffix = Math.random().toString(36).slice(2, 7);
				profile = {
					paymail: `${safeName}${randomSuffix}@yours.org`,
					displayName: displayName,
					avatar: '',
				} as ExtendedProfile;
			}

			if (!profile?.paymail) {
				throw new Error('Failed to get or generate paymail.');
			}

			if (!addresses?.bsvAddress) {
				throw new Error('Failed to get BSV address.');
			}

			dispatch(
				setYoursUser({
					paymail: profile.paymail,
					address: addresses.bsvAddress,
				}),
			);

			setPandaAuth(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login process failed');
			setPandaAuth(false);
		} finally {
			setIsLoading(false);
		}
	};

	if (checkingSession) {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
				<div className="flex w-full max-w-sm flex-col items-center gap-6">
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
					<p className="text-sm text-muted-foreground">Checking authentication...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<a href="/" className="flex items-center gap-2 self-center font-medium">
					<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
						<img src="/images/logo-noBgColor.svg" alt="BitChat" className="h-4 w-4" />
					</div>
					BitChat Nitro
				</a>
				<Card className="overflow-hidden">
					<CardContent className="grid p-0 md:grid-cols-1">
						<div className={cn('flex flex-col gap-6', 'p-6 md:p-8')}>
							<div className="flex flex-col items-center gap-2 text-center">
								<h1 className="text-2xl font-bold">Welcome back</h1>
								<p className="text-balance text-sm text-muted-foreground">
									Sign in with your Bitcoin wallet to continue
								</p>
							</div>
							<div className="grid gap-4">
								{/* Primary: Sign in with Bitcoin (Sigma) */}
								<Button onClick={handleSigmaLogin} disabled={isLoading} className="w-full">
									{isLoading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<svg
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="mr-2"
											aria-hidden="true"
										>
											<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 4v8h2V6h-2zm0 10v2h2v-2h-2z" />
										</svg>
									)}
									Sign in with Bitcoin
								</Button>

								<div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
									<span className="relative z-10 bg-card px-2 text-muted-foreground">
										Or continue with
									</span>
								</div>

								{/* Secondary wallet options */}
								<div className="grid grid-cols-2 gap-4">
									<Button variant="outline" onClick={handleHandcashLogin} disabled={isLoading}>
										<HandcashIcon className="h-4 w-4" />
										<span className="sr-only">HandCash</span>
									</Button>
									<Button
										variant="outline"
										onClick={handleYoursLogin}
										disabled={!isReady || isLoading}
									>
										<YoursIcon size="1rem" />
										<span className="sr-only">Yours Wallet</span>
									</Button>
								</div>

								{error && (
									<div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
										{error}
									</div>
								)}
							</div>
							<div className="text-center text-sm">
								Need a wallet?{' '}
								<Link
									to="https://chromewebstore.google.com/detail/yours-wallet/mlbnicldlpdimbjdcncnklfempedeipj"
									target="_blank"
									rel="noopener noreferrer"
									className="underline underline-offset-4 hover:text-primary"
								>
									Get Yours Wallet
								</Link>
							</div>
							<div className="text-center text-sm text-muted-foreground">
								<Link
									to="/channels/nitro"
									className="underline underline-offset-4 hover:text-primary"
								>
									Continue as guest (read only)
								</Link>
							</div>
						</div>
					</CardContent>
				</Card>
				<div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
					By clicking continue, you agree to our <a href="#">Terms of Service</a> and{' '}
					<a href="#">Privacy Policy</a>.
				</div>
			</div>
		</div>
	);
};
