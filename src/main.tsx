import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { ThemeTokenProvider } from '@theme-token/sdk/react';
import { ConvexReactClient } from 'convex/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { YoursProvider } from 'yours-wallet-provider';
import App from './App';
import { authClient } from './lib/auth-client';
import { BapProvider } from './context/bap';
import { BitcoinProvider } from './context/bitcoin';
import { BmapProvider } from './context/bmap';
import { HandcashProvider } from './context/handcash';
import { ThemeProvider } from './context/theme';
import { AutoYoursProvider } from './context/yours';
import './index.css';
import store from './store';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Note: Sigma iframe signer is initialized lazily when needed for transaction signing
// OAuth authentication does not use the iframe - it's a pure redirect flow

root.render(
	<React.StrictMode>
		<ThemeProvider>
			<ThemeTokenProvider>
				<ConvexBetterAuthProvider client={convex} authClient={authClient}>
					<Provider store={store}>
						<YoursProvider>
							<AutoYoursProvider autoconnect={false}>
								<HandcashProvider>
									<BmapProvider>
										<BapProvider>
											<BitcoinProvider>
												<App />
											</BitcoinProvider>
										</BapProvider>
									</BmapProvider>
								</HandcashProvider>
							</AutoYoursProvider>
						</YoursProvider>
					</Provider>
				</ConvexBetterAuthProvider>
			</ThemeTokenProvider>
		</ThemeProvider>
	</React.StrictMode>,
);
