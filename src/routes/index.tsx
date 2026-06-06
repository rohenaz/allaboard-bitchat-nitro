import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { YoursProvider } from 'yours-wallet-provider';
import { WaitlistAdmin } from '../components/admin/WaitlistAdmin';
import { RequireAccess } from '../components/auth/RequireAccess';
import { Settings } from '../components/auth/Settings';
import { SigmaCallback } from '../components/auth/SigmaCallback';
import { SignIn } from '../components/auth/SignIn';
import ErrorBoundary from '../components/ErrorBoundary';
import { Landing } from '../components/waitlist/Landing';
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
			color: 'var(--foreground)',
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

// Gate the app surface: must be signed in AND approved off the waitlist. The
// wallet providers are only mounted for gated (in-app) routes.
const gated = (element: ReactNode) => <RequireAccess>{withProviders(element)}</RequireAccess>;

const router = createBrowserRouter([
	{
		path: '/',
		element: <Landing />,
	},
	{
		path: '/login',
		element: <SignIn />,
	},
	{
		path: '/signup',
		element: <SignIn />,
	},
	{
		path: '/auth/sigma/callback',
		element: <SigmaCallback />,
	},
	{
		path: '/settings',
		element: <Settings />,
	},
	{
		path: '/admin',
		element: <WaitlistAdmin />,
	},
	{
		path: '/channels',
		element: gated(<LazyComponents.Dashboard isFriendsPage={false} />),
	},
	{
		path: '/friends',
		element: gated(<LazyComponents.Dashboard isFriendsPage={true} />),
	},
	{
		path: '/channels/:channel',
		element: gated(<LazyComponents.Dashboard isFriendsPage={false} />),
	},
	{
		path: '/@/:user',
		element: gated(<LazyComponents.Dashboard isFriendsPage={false} />),
	},
	{
		path: '/servers/new',
		element: gated(<LazyComponents.NewServerPage />),
	},
	{
		path: '/servers/:serverId',
		element: gated(<LazyComponents.ServerSettings />),
	},
]);

export default router;
