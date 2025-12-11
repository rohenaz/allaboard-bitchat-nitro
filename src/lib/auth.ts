/**
 * Sigma OAuth Authentication
 *
 * Uses @sigma-auth/better-auth-plugin for OAuth flow
 * Token exchange happens via nitro-api backend
 */

import { sigmaClient } from '@sigma-auth/better-auth-plugin/client';
import { createAuthClient } from 'better-auth/client';
import { NITRO_API_URL, SIGMA_AUTH_URL } from '../config/constants';

// Create Better Auth client with Sigma plugin
export const authClient = createAuthClient({
	baseURL: SIGMA_AUTH_URL,
	plugins: [sigmaClient()],
});

// Direct replacements for existing sigmaAuth functions
export const sigmaAuth = {
	authorize: () => {
		// Use the plugin's OAuth flow - handles PKCE automatically
		const clientId = import.meta.env.VITE_SIGMA_CLIENT_ID;
		if (!clientId) {
			console.error('[Sigma Auth] VITE_SIGMA_CLIENT_ID environment variable not set');
			throw new Error('VITE_SIGMA_CLIENT_ID is required for OAuth flow');
		}
		authClient.signIn.sigma({
			clientId,
		});
	},

	isAuthenticated: async (): Promise<boolean> => {
		const token = localStorage.getItem('sigma_access_token');
		const userInfo = localStorage.getItem('sigma_user_info');
		return !!(token && userInfo);
	},

	getCurrentUser: async (): Promise<SigmaUserInfo | null> => {
		const userInfoStr = localStorage.getItem('sigma_user_info');
		if (!userInfoStr) return null;

		try {
			const userInfo = JSON.parse(userInfoStr) as SigmaUserInfo;
			// Validate required fields
			if (!userInfo.idKey || !userInfo.public_key || !userInfo.address) {
				console.error('[Sigma Auth] Invalid stored user info, clearing session');
				await sigmaAuth.clearSession();
				return null;
			}
			return userInfo;
		} catch {
			return null;
		}
	},

	logout: async () => {
		// Clear stored tokens and user info
		localStorage.removeItem('sigma_access_token');
		localStorage.removeItem('sigma_user_info');
		sessionStorage.removeItem('sigma_oauth_state');
		sessionStorage.removeItem('sigma_code_verifier');
	},

	handleCallback: async (code: string, state?: string): Promise<SigmaUserInfo> => {
		// Validate state for CSRF protection
		const storedState = sessionStorage.getItem('sigma_oauth_state');
		if (state && state !== storedState) {
			throw new Error('Invalid state parameter');
		}
		sessionStorage.removeItem('sigma_oauth_state');

		// Get PKCE verifier (plugin stored this during signIn.sigma)
		const codeVerifier = sessionStorage.getItem('sigma_code_verifier');
		sessionStorage.removeItem('sigma_code_verifier');

		// Exchange the authorization code for a token via backend proxy
		// The backend signs the request with BITCHAT_MEMBER_WIF to prove client identity
		const redirectUri = `${window.location.origin}/auth/sigma/callback`;

		const tokenResponse = await fetch(`${NITRO_API_URL}/oauth/exchange`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				code,
				redirectUri,
				codeVerifier, // Include PKCE verifier for token exchange
			}),
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json().catch(() => ({}));
			throw new Error(errorData.error || 'Token exchange failed');
		}

		const tokenData = await tokenResponse.json();

		// Fetch user info using the access token
		const userInfoResponse = await fetch(`${SIGMA_AUTH_URL}/api/auth/oauth2/userinfo`, {
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`,
			},
		});

		if (!userInfoResponse.ok) {
			throw new Error('Failed to fetch user info');
		}

		const rawUserInfo: SigmaOAuthUserInfo = await userInfoResponse.json();
		console.log('[Sigma Auth] Raw userinfo response:', rawUserInfo);

		// Store the access token for future API calls
		if (tokenData.access_token) {
			localStorage.setItem('sigma_access_token', tokenData.access_token);
		}

		// Extract public key (required)
		const publicKey = rawUserInfo.pubkey || rawUserInfo.public_key;
		if (!publicKey) {
			throw new Error('No public key in userinfo response');
		}

		// Extract member BAP ID (required)
		const memberBapId = rawUserInfo.bap_id;
		if (!memberBapId) {
			throw new Error('No BAP ID in userinfo response');
		}

		// Extract address - try top-level first, then parse from bap JSON
		let address = rawUserInfo.bitcoin_address || rawUserInfo.address;
		let paymail = rawUserInfo.email;

		if (!address && rawUserInfo.bap) {
			try {
				const bapProfile: BAPProfile = JSON.parse(rawUserInfo.bap);
				address = bapProfile.currentAddress || bapProfile.rootAddress;
				// Also extract paymail from BAP identity if not at top level
				if (!paymail && bapProfile.identity?.paymail) {
					paymail = bapProfile.identity.paymail;
				}
			} catch (e) {
				console.error('[Sigma Auth] Failed to parse BAP profile:', e);
			}
		}

		if (!address) {
			throw new Error('No Bitcoin address in userinfo response');
		}

		// Build strictly typed user info
		const userInfo: SigmaUserInfo = {
			sub: rawUserInfo.sub,
			idKey: memberBapId,
			public_key: publicKey,
			address: address,
			paymail: paymail,
			displayName: rawUserInfo.name,
			avatar: rawUserInfo.picture || rawUserInfo.avatar || rawUserInfo.image,
		};

		console.log('[Sigma Auth] Validated user info:', userInfo);
		console.log('[Sigma Auth] Member BAP ID:', memberBapId);

		// Store user info for future retrieval
		localStorage.setItem('sigma_user_info', JSON.stringify(userInfo));

		return userInfo;
	},

	getStoredSession: async () => {
		const token = localStorage.getItem('sigma_access_token');
		const userInfo = localStorage.getItem('sigma_user_info');

		if (!token || !userInfo) return null;

		return {
			token,
			user: JSON.parse(userInfo),
		};
	},

	clearSession: async () => {
		localStorage.removeItem('sigma_access_token');
		localStorage.removeItem('sigma_user_info');
		sessionStorage.removeItem('sigma_oauth_state');
		sessionStorage.removeItem('sigma_code_verifier');
	},
};

/**
 * Strict type for Sigma OAuth userinfo response
 * Based on actual response from auth.sigmaidentity.com/api/auth/oauth2/userinfo
 */
export interface SigmaOAuthUserInfo {
	sub: string; // OAuth user ID
	name?: string; // Display name
	email?: string; // Paymail/email
	pubkey?: string; // Bitcoin public key
	public_key?: string; // Alternate field name for pubkey
	bitcoin_address?: string; // Bitcoin address
	address?: string; // Alternate field name
	avatar?: string; // Avatar URL
	image?: string; // Alternate field name for avatar
	picture?: string; // OIDC standard field for avatar
	bap_id: string; // Member BAP ID (required)
	bap?: string; // BAP profile JSON string (contains addresses)
}

/**
 * Parsed BAP profile from userinfo response
 */
interface BAPProfile {
	id: string;
	rootAddress: string;
	currentAddress: string;
	identity?: {
		paymail?: string;
	};
}

/**
 * Internal user info format used throughout the app
 */
export interface SigmaUserInfo {
	sub: string; // OAuth user ID
	idKey: string; // Member BAP ID from Sigma
	public_key: string; // Bitcoin public key
	address: string; // Bitcoin address
	paymail?: string; // Paymail
	displayName?: string; // Display name
	avatar?: string; // Avatar URL
}
