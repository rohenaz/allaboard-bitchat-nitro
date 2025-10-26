import { BitcoinAuthProvider, LoginForm } from 'bigblocks';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks';
import { loadChannels } from '../../reducers/channelsReducer';
import { setYoursUser } from '../../reducers/sessionReducer';
import Layout from './Layout';

interface AuthUser {
  id: string;
  address: string;
  idKey: string;
  profiles?: unknown[];
}

interface AuthError {
  code: string;
  message: string;
}

export const BigBlocksLoginPage: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSuccess = async (user: AuthUser) => {
    // Set user in Redux store using setYoursUser action
    dispatch(
      setYoursUser({
        paymail: user.address, // Use Bitcoin address as paymail for now
        address: user.address,
      }),
    );

    // Load channels and navigate to dashboard
    try {
      await dispatch(loadChannels()).unwrap();
      navigate('/channels/nitro');
    } catch (error) {
      console.error('Failed to load channels:', error);
      navigate('/channels/nitro'); // Navigate anyway
    }
  };

  const handleError = (error: AuthError) => {
    console.error('BigBlocks login failed:', error);
    // Handle specific error types as needed
  };

  return (
    <Layout heading="Sign in with Bitcoin Wallet">
      <BitcoinAuthProvider config={{ apiUrl: '/api' }}>
        <LoginForm
          mode="signin"
          onSuccess={handleSuccess}
          onError={handleError}
          cardProps={{
            size: '3',
            variant: 'surface',
          }}
          buttonProps={{
            size: '3',
            variant: 'solid',
          }}
        />
      </BitcoinAuthProvider>
    </Layout>
  );
};

export default BigBlocksLoginPage;
