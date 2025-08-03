import { createAuthClient } from 'better-auth/client';
import { genericOAuthClient } from 'better-auth/client/plugins';

// Better-auth client configuration
// This points to the external Sigma auth server, not our local API
export const authClient = createAuthClient({
  baseURL:
    import.meta.env.VITE_SIGMA_AUTH_URL || 'https://auth.sigmaidentity.com',
  plugins: [genericOAuthClient()],
});

// Direct replacements for existing sigmaAuth functions
export const sigmaAuth = {
  authorize: () => {
    // For OAuth flow, we need to redirect to the auth server
    // The genericOAuth plugin expects a redirect, not an API call
    const clientId = import.meta.env.VITE_SIGMA_CLIENT_ID || 'bitchat-nitro';
    const authUrl = import.meta.env.VITE_SIGMA_AUTH_URL || 'https://auth.sigmaidentity.com';
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
      scope: 'read',
    });
    
    // Redirect to OAuth authorization endpoint
    window.location.href = `${authUrl}/api/oauth/authorize?${params.toString()}`;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const { data } = await authClient.getSession();
    return !!data?.user;
  },

  getCurrentUser: async () => {
    const { data } = await authClient.getSession();
    if (!data?.user) return null;

    // Map better-auth user to existing SigmaUserInfo format
    return {
      sub: data.user.id,
      public_key: data.user.publicKey,
      address: data.user.bitcoinAddress,
      bapIdKey: data.user.bapIdKey,
      avatar: data.user.image,
      displayName: data.user.name,
      name: data.user.name,
      paymail: data.user.paymail || data.user.email,
      publicKey: data.user.publicKey,
    };
  },

  logout: async () => {
    await authClient.signOut();
  },

  handleCallback: async (code: string, state?: string) => {
    // Validate state for CSRF protection
    const storedState = sessionStorage.getItem('oauth_state');
    if (state && state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    sessionStorage.removeItem('oauth_state');

    // Exchange authorization code for token
    const clientId = import.meta.env.VITE_SIGMA_CLIENT_ID || 'bitchat-nitro';
    const authUrl = import.meta.env.VITE_SIGMA_AUTH_URL || 'https://auth.sigmaidentity.com';
    const redirectUri = `${window.location.origin}/auth/sigma/callback`;

    const tokenResponse = await fetch(`${authUrl}/api/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch(`${authUrl}/api/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user information');
    }

    const userInfo = await userInfoResponse.json();

    // Store the session token if provided
    if (tokenData.session_token) {
      // Store in a way that better-auth can use
      localStorage.setItem('better-auth.session', JSON.stringify({
        token: tokenData.session_token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }));
    }

    return {
      sub: userInfo.sub,
      public_key: userInfo.public_key,
      address: userInfo.address,
      bapIdKey: userInfo.bapIdKey,
      avatar: userInfo.avatar,
      displayName: userInfo.displayName || userInfo.name,
      name: userInfo.name,
      paymail: userInfo.paymail,
      publicKey: userInfo.public_key,
    };
  },

  getStoredSession: async () => {
    const { data } = await authClient.getSession();
    return data?.session || null;
  },

  clearSession: async () => {
    await authClient.signOut();
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
