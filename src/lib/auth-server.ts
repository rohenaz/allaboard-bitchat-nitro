import { PublicKey } from '@bsv/sdk';
import { betterAuth } from 'better-auth';
import { genericOAuth } from 'better-auth/plugins';

// Server-side auth configuration
export const auth = betterAuth({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3055',

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: 'sigma',
          clientId: process.env.VITE_SIGMA_CLIENT_ID || 'bitchat-nitro',
          clientSecret: '', // Sigma doesn't use client secret

          // Sigma endpoints
          authorizationUrl: 'https://auth.sigmaidentity.com/authorize',
          tokenUrl: 'https://auth.sigmaidentity.com/token',
          userInfoUrl: 'https://auth.sigmaidentity.com/userinfo',

          // Required scopes
          scopes: ['openid', 'profile'],

          // PKCE for security
          pkce: true,

          // Map Sigma profile to user
          mapProfileToUser: async (profile) => {
            // Parse JWT if userinfo failed
            if (!profile.public_key && profile.access_token) {
              const payload = JSON.parse(
                atob(profile.access_token.split('.')[1]),
              );
              profile.public_key = payload.public_key;
              profile.bapIdKey = payload.bapIdKey;
              profile.sub = payload.sub;
            }

            // Derive Bitcoin address
            let address = profile.address;
            if (!address && profile.public_key) {
              try {
                const pubKey = PublicKey.fromString(profile.public_key);
                address = pubKey.toAddress();
              } catch (e) {
                console.error('Failed to derive address:', e);
              }
            }

            return {
              id: profile.sub,
              name:
                profile.name ||
                profile.displayName ||
                `Guest (${address?.slice(0, 8)}...)`,
              email: profile.paymail || `${address}@bitcoin.sv`,
              image: profile.avatar || profile.image,

              // Custom fields for Bitcoin
              publicKey: profile.public_key,
              bapIdKey: profile.bapIdKey,
              bitcoinAddress: address,
              paymail: profile.paymail,
            };
          },
        },
      ],
    }),
  ],

  // Session configuration
  session: {
    freshAge: 5 * 60, // 5 minutes
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  // User schema extensions
  user: {
    additionalFields: {
      publicKey: {
        type: 'string',
        required: false,
      },
      bapIdKey: {
        type: 'string',
        required: false,
      },
      bitcoinAddress: {
        type: 'string',
        required: false,
      },
      paymail: {
        type: 'string',
        required: false,
      },
    },
  },
});
