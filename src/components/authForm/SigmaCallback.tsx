import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch } from '../../hooks';
import { sigmaAuth } from '../../lib/sigma-auth';
import { loadChannels } from '../../reducers/channelsReducer';
import { setSigmaUser } from '../../reducers/sessionReducer';
import Layout from './Layout';

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid var(--background-modifier-accent);
  border-top: 3px solid var(--brand-experiment);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  margin-top: 16px;
  padding: 12px;
  background-color: rgba(250, 124, 124, 0.1);
  border: 1px solid var(--text-danger);
  border-radius: 4px;
  color: var(--text-danger);
  font-size: 14px;
  text-align: center;
`;

const LoadingText = styled.p`
  color: var(--text-normal);
  font-size: 16px;
  text-align: center;
`;

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
        const errorParam = urlParams.get('error');

        if (errorParam) {
          setError(`Authentication error: ${errorParam}`);
          setIsLoading(false);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setIsLoading(false);
          return;
        }

        // Exchange code for user information
        const userInfo = await sigmaAuth.handleCallback(code);

        // Update session state
        dispatch(
          setSigmaUser({
            paymail: userInfo.paymail,
            address: userInfo.address,
            displayName: userInfo.displayName || 'Bitcoin User',
            avatar: userInfo.avatar || '',
            publicKey: userInfo.publicKey,
            sub: userInfo.sub,
          }),
        );

        // Load channels and redirect to main app
        await dispatch(loadChannels());
        navigate('/channels/nitro');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  if (isLoading) {
    return (
      <Layout heading="Completing Bitcoin Authentication">
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Verifying your Bitcoin identity...</LoadingText>
        </LoadingContainer>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout heading="Authentication Error">
        <ErrorMessage>{error}</ErrorMessage>
        <LoadingContainer>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--brand-experiment)',
              color: 'var(--white-500)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            Back to Login
          </button>
        </LoadingContainer>
      </Layout>
    );
  }

  return null;
};
