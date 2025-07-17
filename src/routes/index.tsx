import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { YoursProvider } from 'yours-wallet-provider';
import ErrorBoundary from '../components/ErrorBoundary';
import { BapProvider } from '../context/bap';
import { BitcoinProvider } from '../context/bitcoin';
import { BmapProvider } from '../context/bmap';
import { HandcashProvider } from '../context/handcash';
import { AutoYoursProvider } from '../context/yours';
import * as LazyComponents from './lazyComponents';

const LoadingSpinner = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      color: 'var(--text-primary)',
    }}
  >
    Loading...
  </div>
);

const withProviders = (element: ReactNode) => (
  <ErrorBoundary>
    <HandcashProvider>
      <YoursProvider>
        <AutoYoursProvider autoconnect={false}>
          <BmapProvider>
            <BapProvider>
              <BitcoinProvider>
                <Suspense fallback={<LoadingSpinner />}>{element}</Suspense>
              </BitcoinProvider>
            </BapProvider>
          </BmapProvider>
        </AutoYoursProvider>
      </YoursProvider>
    </HandcashProvider>
  </ErrorBoundary>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: withProviders(<LazyComponents.LoginPage />),
  },
  {
    path: '/login',
    element: withProviders(<LazyComponents.BigBlocksLoginPage />),
  },
  {
    path: '/signup',
    element: withProviders(<LazyComponents.SignupPage />),
  },
  {
    path: '/auth/sigma/callback',
    element: withProviders(<LazyComponents.SigmaCallback />),
  },
  {
    path: '/channels',
    element: withProviders(<LazyComponents.Dashboard isFriendsPage={false} />),
  },
  {
    path: '/friends',
    element: withProviders(<LazyComponents.Dashboard isFriendsPage={true} />),
  },
  {
    path: '/channels/:channel',
    element: withProviders(<LazyComponents.Dashboard isFriendsPage={false} />),
  },
  {
    path: '/@/:user',
    element: withProviders(<LazyComponents.Dashboard isFriendsPage={false} />),
  },
]);

export default router;
