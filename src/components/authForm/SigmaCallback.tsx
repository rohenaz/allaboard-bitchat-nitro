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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

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

        console.log('Processing OAuth callback with code:', code.substring(0, 8) + '...');

        // Exchange code for user information with state validation
        const userInfo = await sigmaAuth.handleCallback(code, state || undefined);

        console.log('User authenticated successfully:', {
          sub: userInfo.sub,
          address: userInfo.address,
          displayName: userInfo.displayName,
        });

        // Determine if user has a BAP profile or is a guest
        const hasProfile = Boolean(userInfo.displayName && userInfo.displayName !== '');
        const displayName = hasProfile 
          ? userInfo.displayName 
          : `Guest (${userInfo.address.slice(0, 8)}...)`;

        console.log(`User login type: ${hasProfile ? 'BAP Profile' : 'Guest'}, Display name: ${displayName}`);

        // Update session state in Redux
        dispatch(
          setSigmaUser({
            paymail: userInfo.paymail,
            address: userInfo.address,
            displayName: displayName,
            avatar: userInfo.avatar || '',
            publicKey: userInfo.publicKey,
            sub: userInfo.sub,
          }),
        );

        // Load channels and redirect to main app
        console.log('Loading channels...');
        await dispatch(loadChannels());
        
        console.log('Redirecting to main app...');
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

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setError('');
      setIsLoading(true);
      
      // Retry the callback handling
      window.location.reload();
    } else {
      navigate('/login');
    }
  };

  const handleBackToLogin = () => {
    // Clear any stored auth state
    sigmaAuth.clearSession();
    navigate('/login');
  };

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
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            {retryCount < maxRetries && (
              <button
                type="button"
                onClick={handleRetry}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--brand-experiment)',
                  color: 'var(--white-500)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Retry ({retryCount + 1}/{maxRetries})
              </button>
            )}
            <button
              type="button"
              onClick={handleBackToLogin}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--background-modifier-accent)',
                color: 'var(--text-normal)',
                border: '1px solid var(--background-modifier-accent)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Back to Login
            </button>
          </div>
        </LoadingContainer>
      </Layout>
    );
  }

  return null;
};
