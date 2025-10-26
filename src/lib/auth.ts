/**
 * Sigma OAuth Authentication
 *
 * Pure OAuth2 flow - no better-auth client needed since we're frontend-only
 * All auth happens on auth.sigmaidentity.com
 */

import { SIGMA_AUTH_URL } from '../config/env';

// Direct replacements for existing sigmaAuth functions
export const sigmaAuth = {
  authorize: () => {
    // Direct OAuth2 authorization flow to Sigma
    const clientId = import.meta.env.VITE_SIGMA_CLIENT_ID || 'bitchat-nitro';
    const redirectUri = `${window.location.origin}/auth/sigma/callback`;

    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauth_state', state);

    // Build OAuth authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
      scope: 'openid profile email',
    });

    // Redirect to OAuth authorization endpoint
    window.location.href = `${SIGMA_AUTH_URL}/api/oauth/authorize?${params.toString()}`;
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

    // Exchange the authorization code for a token via backend proxy
    // The backend signs the request with BITCHAT_MEMBER_WIF to prove client identity
    const redirectUri = `${window.location.origin}/auth/sigma/callback`;
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.bitchatnitro.com';

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
    const userInfoResponse = await fetch(`${SIGMA_AUTH_URL}/api/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfoData = await userInfoResponse.json();
    console.log('[Sigma Auth] Userinfo response:', userInfoData);

    // Store the access token for future API calls
    if (tokenData.access_token) {
      localStorage.setItem('sigma_access_token', tokenData.access_token);
    }

    // Build user info in expected format
    // Note: bapIdKey should be the member BAP ID (derived from client's BAP ID + user's identity)
    const userInfo = {
      sub: userInfoData.sub,
      public_key: userInfoData.pubkey || userInfoData.public_key,
      address: userInfoData.bitcoin_address || userInfoData.address || userInfoData.name,
      bapIdKey: userInfoData.bapIdKey || userInfoData.member_bap_id || userInfoData.signingPubkey,
      avatar: userInfoData.avatar || userInfoData.image,
      displayName: userInfoData.name || userInfoData.displayName,
      name: userInfoData.name,
      paymail: userInfoData.email || userInfoData.paymail,
      publicKey: userInfoData.pubkey || userInfoData.public_key,
    };

    console.log('[Sigma Auth] Mapped user info:', userInfo);
    console.log('[Sigma Auth] Member BAP ID:', userInfo.bapIdKey);

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
