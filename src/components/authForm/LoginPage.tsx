import React, { type FC, useEffect, useState } from 'react';
import { FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  type SocialProfile as BaseSocialProfile,
  useYoursWallet,
} from 'yours-wallet-provider';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useAppDispatch } from '../../hooks';
import { loadChannels } from '../../reducers/channelsReducer';
import { setYoursUser } from '../../reducers/sessionReducer';
import env from '../../utils/env';
import { Button } from '../common/Button';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--background-primary);
`;

const LoginCard = styled.div`
  background-color: var(--background-secondary);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 2rem;
`;

const ErrorMessage = styled.div`
  color: var(--error);
  text-align: center;
  margin-top: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const LinkGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  
  a {
    color: var(--text-link);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
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
  const {
    isReady,
    isConnected,
    connect,
    getSocialProfile: getWalletProfile,
  } = useYoursWallet();
  const { getSocialProfile, getAddresses } = useYours();
  const { setAuthToken, profile, getProfile } = useHandcash();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [pandaAuth, setPandaAuth] = useState(false);

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
    window.location.href = `${env.HANDCASH_API_URL}/hcLogin`;
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
        console.log('Getting profile directly from wallet...');
        const walletProfile = await getWalletProfile();
        console.log('Wallet profile:', walletProfile);
        if (walletProfile?.displayName) {
          profile = walletProfile as ExtendedProfile;
        }
      } catch (walletErr) {
        console.error('Error getting wallet profile:', walletErr);
      }

      if (!profile?.paymail) {
        console.log('Getting profile through context...');
        const contextProfile = await getSocialProfile();
        if (contextProfile?.displayName) {
          profile = contextProfile as ExtendedProfile;
        }
        console.log('Context profile:', profile);
      }

      console.log('Getting addresses...');
      addresses = await getAddresses();
      console.log('Addresses:', addresses);

      // Generate fake paymail if none exists
      if (!profile?.paymail && profile?.displayName) {
        const displayName = profile.displayName;
        const safeName = displayName
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w.-]/g, '');
        profile = {
          ...profile,
          paymail: `${safeName}@yours.org`,
        };
      } else if (!profile?.paymail) {
        profile = {
          displayName: 'anonymous',
          paymail: 'anonymous@yours.org',
          avatar: '',
        } as ExtendedProfile;
      }

      if (!addresses?.bsvAddress) {
        throw new Error('Failed to get BSV address from Yours wallet.');
      }

      if (!profile?.paymail) {
        throw new Error('Failed to get or generate paymail.');
      }

      console.log('Dispatching user info:', {
        paymail: profile.paymail,
        address: addresses.bsvAddress,
      });

      dispatch(
        setYoursUser({
          paymail: profile.paymail,
          address: addresses.bsvAddress,
        }),
      );

      setPandaAuth(true);
      console.log('Login successful');
    } catch (err) {
      console.error('Login process failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to Yours wallet. Please make sure you are logged in and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <Title>Welcome to BitChat</Title>
        <ButtonGroup>
          <Button
            onClick={handleHandcashLogin}
            color="#2fac69"
            $hoverColor="#08a350"
            disabled={isLoading}
          >
            Login with Handcash
          </Button>
          <Button
            onClick={handleYoursLogin}
            color="rgba(154, 224, 133, 0.25)"
            $hoverColor="rgba(154, 224, 133, 0.1)"
            disabled={!isReady || isLoading}
          >
            <FaWallet />{' '}
            {isLoading ? 'Connecting...' : 'Login with Yours Wallet'}
          </Button>
        </ButtonGroup>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <LinkGroup>
          <div>
            Need an account?{' '}
            <a
              href="https://chromewebstore.google.com/detail/yours-wallet/mlbnicldlpdimbjdcncnklfempedeipj"
              target="_blank"
              rel="noopener noreferrer"
            >
              Register
            </a>
          </div>
          <div>
            <a href="/channels">Continue as guest (read only)</a>
          </div>
        </LinkGroup>
      </LoginCard>
    </Container>
  );
};
