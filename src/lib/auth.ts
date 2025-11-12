/**
 * Sigma OAuth Authentication
 *
 * Pure OAuth2 flow - no better-auth client needed since we're frontend-only
 * All auth happens on auth.sigmaidentity.com
 */

import { NITRO_API_URL, SIGMA_AUTH_URL } from '../config/constants';

// Direct replacements for existing sigmaAuth functions
export const sigmaAuth = {
  authorize: () => {
    // Direct OAuth2 authorization flow to Sigma
    // Client is identified on nitro-api side via BITCHAT_MEMBER_WIF signature
    const redirectUri = `${window.location.origin}/auth/sigma/callback`;

    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauth_state', state);

    // Build OAuth authorization URL
    const params = new URLSearchParams({
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

  getCurrentUser: async (): Promise<SigmaUserInfo | null> => {
    const userInfoStr = localStorage.getItem('sigma_user_info');
    if (!userInfoStr) return null;

    try {
      const userInfo = JSON.parse(userInfoStr) as SigmaUserInfo;
      // Validate required fields
      if (!userInfo.bapId || !userInfo.idKey || !userInfo.public_key || !userInfo.address) {
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
    sessionStorage.removeItem('oauth_state');
  },

  handleCallback: async (code: string, state?: string): Promise<SigmaUserInfo> => {
    // Validate state for CSRF protection
    const storedState = sessionStorage.getItem('oauth_state');
    if (state && state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    sessionStorage.removeItem('oauth_state');

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

    // Extract address (required)
    const address = rawUserInfo.bitcoin_address || rawUserInfo.address;
    if (!address) {
      throw new Error('No Bitcoin address in userinfo response');
    }

    // Extract member BAP ID (required)
    const memberBapId = rawUserInfo.bap_id;
    if (!memberBapId) {
      throw new Error('No BAP ID in userinfo response');
    }

    // Build strictly typed user info
    const userInfo: SigmaUserInfo = {
      sub: rawUserInfo.sub,
      bapId: memberBapId,
      idKey: memberBapId,
      public_key: publicKey,
      address: address,
      paymail: rawUserInfo.email,
      displayName: rawUserInfo.name,
      avatar: rawUserInfo.avatar || rawUserInfo.image,
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
    sessionStorage.removeItem('oauth_state');
  },
};

/**
 * Strict type for Sigma OAuth userinfo response
 * Based on actual response from auth.sigmaidentity.com/api/oauth/userinfo
 */
export interface SigmaOAuthUserInfo {
  sub: string;                    // OAuth user ID
  name?: string;                  // Display name
  email?: string;                 // Paymail/email
  pubkey?: string;                // Bitcoin public key
  public_key?: string;            // Alternate field name for pubkey
  bitcoin_address?: string;       // Bitcoin address
  address?: string;               // Alternate field name
  avatar?: string;                // Avatar URL
  image?: string;                 // Alternate field name for avatar
  bap_id: string;                 // Member BAP ID (required)
}

/**
 * Internal user info format used throughout the app
 * NOTE: bapId and idKey are THE SAME THING - both are the member BAP ID from Sigma
 */
export interface SigmaUserInfo {
  sub: string;                    // OAuth user ID
  bapId: string;                  // Member BAP ID from Sigma (required)
  idKey: string;                  // Same as bapId (required)
  public_key: string;             // Bitcoin public key
  address: string;                // Bitcoin address
  paymail?: string;               // Paymail
  displayName?: string;           // Display name
  avatar?: string;                // Avatar URL
}
