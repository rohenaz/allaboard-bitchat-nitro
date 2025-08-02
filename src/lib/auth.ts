import { createAuthClient } from 'better-auth/client';
import { genericOAuthClient } from 'better-auth/client/plugins';

// Better-auth client configuration
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3055',
  plugins: [genericOAuthClient()],
});

// Direct replacements for existing sigmaAuth functions
export const sigmaAuth = {
  authorize: () => {
    return authClient.signIn.oauth({
      providerId: 'sigma',
      callbackURL: `${window.location.origin}/auth/sigma/callback`,
    });
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

  handleCallback: async (_code: string, _state?: string) => {
    // Better-auth handles this automatically
    const { data } = await authClient.getSession();
    if (!data?.user) {
      throw new Error('Authentication failed - no session found');
    }

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
