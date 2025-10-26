import { createAuthClient } from 'better-auth/react';
import { sigmaClient } from './sigma-client-plugin';

// Create the Better Auth client with sigma plugin
// NOTE: We don't set baseURL because our sigma plugin handles the OAuth redirect manually
// The plugin redirects to auth.sigmaidentity.com/api/oauth/authorize
export const authClient = createAuthClient({
  plugins: [sigmaClient()],
});

// Export hooks for React components
export const { useSession } = authClient;

// Direct replacements for existing sigmaAuth functions
export const sigmaAuth = {
  authorize: () => {
    // Use the better-auth sigma plugin to initiate OAuth flow
    // This will redirect to auth.sigmaidentity.com/api/oauth/authorize
    // The auth server handles all signing with its member key
    authClient.signIn.sigma();
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = localStorage.getItem('sigma_access_token');
    const userInfo = localStorage.getItem('sigma_user_info');
    return !!(token && userInfo);
  },

  getCurrentUser: async () => {
    const userInfoStr = localStorage.getItem('sigma_user_info');
    if (!userInfoStr) return null;

    try {
      return JSON.parse(userInfoStr);
    } catch {
      return null;
    }
  },

  logout: async () => {
    // Clear stored tokens and user info
    localStorage.removeItem('sigma_access_token');
    localStorage.removeItem('sigma_user_info');
    sessionStorage.removeItem('oauth_state');
  },

  handleCallback: async (code: string, state?: string) => {
    // Validate state for CSRF protection
    const storedState = sessionStorage.getItem('oauth_state');
    if (state && state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    sessionStorage.removeItem('oauth_state');

    // Exchange the authorization code for a token via our API (which will sign the request)
    const apiUrl = import.meta.env.VITE_NITRO_API_URL || 'https://api.bitchatnitro.com';
    const redirectUri = `${window.location.origin}/auth/sigma/callback`;

    const tokenResponse = await fetch(`${apiUrl}/oauth/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Token exchange failed');
    }

    const tokenData = await tokenResponse.json();

    // Fetch user info using the access token
    const authUrl = import.meta.env.VITE_SIGMA_AUTH_URL || 'https://auth.sigmaidentity.com';

    const userInfoResponse = await fetch(`${authUrl}/api/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfoData = await userInfoResponse.json();

    // Store the access token for future API calls
    if (tokenData.access_token) {
      localStorage.setItem('sigma_access_token', tokenData.access_token);
    }

    // Build user info in expected format
    const userInfo = {
      sub: userInfoData.sub,
      public_key: userInfoData.pubkey,
      address: userInfoData.bitcoin_address || userInfoData.name,
      bapIdKey: userInfoData.bapIdKey,
      avatar: userInfoData.avatar || userInfoData.image,
      displayName: userInfoData.name,
      name: userInfoData.name,
      paymail: userInfoData.email,
      publicKey: userInfoData.pubkey,
    };

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
    sessionStorage.removeItem('oauth_state');
  },
};

// Export types (these will be defined by better-auth)
export type SigmaUserInfo = {
  sub: string;
  public_key: string;
  address: string;
  bapIdKey?: string;
  avatar?: string;
  displayName?: string;
  name?: string;
  paymail?: string;
  publicKey?: string;
};
