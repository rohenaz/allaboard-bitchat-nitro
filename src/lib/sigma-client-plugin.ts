import type { BetterAuthClientPlugin } from 'better-auth/client';

// Response type from the sigma sign-in endpoint
export interface SigmaSignInResponse {
  user?: {
    id: string;
    pubkey: string;
    name: string;
    email: string;
  };
  session?: {
    token: string;
  };
  code?: string; // OAuth authorization code if in OAuth flow
}

// Define the server plugin type for the client
interface SigmaServerPlugin {
  id: 'sigma';
  endpoints: {
    signInSigma: any;
  };
}

export const sigmaClient = () => {
  return {
    id: 'sigma',
    $InferServerPlugin: {} as SigmaServerPlugin,
    getActions: ($fetch) => {
      return {
        signIn: {
          sigma: (options?: {
            callbackURL?: string;
            errorCallbackURL?: string;
            provider?: string;
          }) => {
            // OAuth authorization flow - plain browser redirect
            // Platform member key signature happens on the auth SERVER during token exchange, not here

            // Generate state for CSRF protection
            const state = Math.random().toString(36).substring(7);

            if (typeof window !== 'undefined') {
              sessionStorage.setItem('oauth_state', state);
            }

            const authUrl = import.meta.env.VITE_SIGMA_AUTH_URL || 'https://auth.sigmaidentity.com';
            const redirectUri = `${window.location.origin}/auth/sigma/callback`;

            // Build OAuth authorization URL
            const params = new URLSearchParams({
              redirect_uri: redirectUri,
              response_type: 'code',
              state,
              scope: 'read',
            });

            // Add provider if specified (for GitHub/Google OAuth)
            if (options?.provider) {
              params.append('provider', options.provider);
            }

            // Redirect to OAuth authorization endpoint
            const fullAuthUrl = `${authUrl}/api/oauth/authorize?${params.toString()}`;

            if (typeof window !== 'undefined') {
              window.location.href = fullAuthUrl;
            }

            // Return a promise that won't resolve since we're redirecting
            return new Promise(() => {
              // Redirecting - promise intentionally never resolves
            });
          },
        },
      };
    },
  } satisfies BetterAuthClientPlugin;
};
