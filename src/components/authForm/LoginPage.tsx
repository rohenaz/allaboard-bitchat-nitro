import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import type { SocialProfile as BaseSocialProfile } from 'yours-wallet-provider';
import { useYoursWallet } from 'yours-wallet-provider';
import { NITRO_API_URL } from '../../config/constants';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useAppDispatch } from '../../hooks';
import { sigmaAuth } from '../../lib/auth';
import { loadChannels } from '../../reducers/channelsReducer';
import { setSigmaUser, setYoursUser } from '../../reducers/sessionReducer';
import HandcashIcon from '../icons/HandcashIcon';
import YoursIcon from '../icons/YoursIcon';
import Layout from './Layout';

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

interface LoginButtonProps {
	$secondary?: boolean;
}

const LoginButton = styled.button<LoginButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.15s ease;
  border: none;
  cursor: pointer;
  background-color: ${(props) => (props.$secondary ? 'var(--background-modifier-accent)' : 'var(--brand-experiment)')};
  color: ${(props) => (props.$secondary ? 'var(--text-normal)' : 'var(--white-500)')};
  
  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$secondary ? 'var(--background-modifier-hover)' : 'var(--brand-experiment-hover)')};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 16px;
  padding: 12px;
  background-color: color-mix(in oklch, var(--destructive), transparent 90%);
  border: 1px solid var(--text-danger);
  border-radius: 4px;
  color: var(--text-danger);
  font-size: 14px;
`;

const FooterLinks = styled.div`
  margin-top: 32px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
  
  > div {
    margin-bottom: 8px;
  }
`;

const StyledLink = styled(Link)`
  color: var(--text-link);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

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
				// Check if user is already authenticated via sigma-auth
				const isAuthenticated = await sigmaAuth.isAuthenticated();
				if (isAuthenticated) {
					const currentUser = await sigmaAuth.getCurrentUser();
					if (currentUser) {
						// currentUser is strictly typed SigmaUserInfo
						dispatch(setSigmaUser(currentUser));

						// Load channels and redirect
						await dispatch(loadChannels());
						navigate('/channels/nitro');
						return;
					}
				}
			} catch (error) {
				console.error('Error checking existing session:', error);
				// Clear any corrupted session data
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

	// Show loading state while checking existing session
	if (checkingSession) {
		return (
			<Layout heading="Checking authentication...">
				<div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
					<div
						style={{
							width: '40px',
							height: '40px',
							border: '3px solid var(--background-modifier-accent)',
							borderTop: '3px solid var(--brand-experiment)',
							borderRadius: '50%',
							animation: 'spin 1s linear infinite',
						}}
					/>
				</div>
			</Layout>
		);
	}

	return (
		<Layout heading="Choose your login method">
			<ButtonContainer>
				<LoginButton type="button" onClick={handleSigmaLogin} disabled={isLoading}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 4v8h2V6h-2zm0 10v2h2v-2h-2z" />
					</svg>
					Sign in with Bitcoin
				</LoginButton>
				<LoginButton type="button" onClick={handleHandcashLogin} disabled={isLoading} $secondary>
					<HandcashIcon className="w-5 h-5" />
					Login with Handcash
				</LoginButton>
				<LoginButton
					type="button"
					onClick={handleYoursLogin}
					disabled={!isReady || isLoading}
					$secondary
				>
					<YoursIcon size="1.25rem" />
					{isLoading ? 'Connecting...' : 'Login with Yours Wallet'}
				</LoginButton>
			</ButtonContainer>

			{error && (
				<ErrorMessage>
					<span>{error}</span>
				</ErrorMessage>
			)}
			<FooterLinks>
				<div>
					Need an account?{' '}
					<StyledLink
						to="https://chromewebstore.google.com/detail/yours-wallet/mlbnicldlpdimbjdcncnklfempedeipj"
						target="_blank"
						rel="noopener noreferrer"
					>
						Register
					</StyledLink>
				</div>
				<div>
					<StyledLink to="/channels/nitro">Continue as guest (read only)</StyledLink>
				</div>
			</FooterLinks>
		</Layout>
	);
};
