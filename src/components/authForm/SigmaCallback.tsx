import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '../../hooks';
import { sigmaAuth } from '../../lib/auth';
import { loadChannels } from '../../reducers/channelsReducer';
import { setSigmaUser } from '../../reducers/sessionReducer';
import Layout from './Layout';

export const SigmaCallback: FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [error, setError] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const handleCallback = async () => {
			try {
				const urlParams = new URLSearchParams(window.location.search);
				const code = urlParams.get('code');
				const state = urlParams.get('state');
				const errorParam = urlParams.get('error');
				const errorDescription = urlParams.get('error_description');

				// Handle OAuth error responses
				if (errorParam) {
					let errorMessage = `Authentication error: ${errorParam}`;
					if (errorDescription) {
						errorMessage += ` - ${errorDescription}`;
					}
					setError(errorMessage);
					setIsLoading(false);
					return;
				}

				// Validate required parameters
				if (!code) {
					setError('No authorization code received from authentication provider');
					setIsLoading(false);
					return;
				}

				// Exchange code for user information with state validation
				const userInfo = await sigmaAuth.handleCallback(code, state || undefined);

				// userInfo is strictly typed SigmaUserInfo with required fields validated
				// Update session state in Redux
				dispatch(setSigmaUser(userInfo));
				await dispatch(loadChannels());
				navigate('/channels/nitro');
			} catch (err) {
				console.error('OAuth callback error:', err);

				const errorMessage = err instanceof Error ? err.message : 'Authentication failed';

				// Handle specific error types
				if (errorMessage.includes('Invalid or expired state')) {
					setError('Security validation failed. Please try signing in again.');
				} else if (errorMessage.includes('Network')) {
					setError('Network error. Please check your connection and try again.');
				} else if (errorMessage.includes('Token exchange failed')) {
					setError('Failed to complete authentication. Please try again.');
				} else {
					setError(errorMessage);
				}

				setIsLoading(false);
			}
		};

		handleCallback();
	}, [dispatch, navigate]);

	const handleBackToLogin = () => {
		// Clear any stored auth state
		sigmaAuth.clearSession();
		navigate('/login');
	};

	if (isLoading) {
		return (
			<Layout heading="Completing Bitcoin Authentication">
				<div className="flex flex-col items-center gap-4 p-6">
					<div className="w-10 h-10 border-[3px] border-border border-t-primary rounded-full animate-spin" />
					<p className="text-foreground text-center">Verifying your Bitcoin identity...</p>
				</div>
			</Layout>
		);
	}

	if (error) {
		return (
			<Layout heading="Authentication Error">
				<div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm text-center">
					{error}
				</div>
				<div className="flex flex-col items-center gap-4 p-6">
					<div className="flex gap-3 mt-4">
						<Button variant="outline" onClick={handleBackToLogin}>
							Back to Login
						</Button>
					</div>
				</div>
			</Layout>
		);
	}

	return null;
};
