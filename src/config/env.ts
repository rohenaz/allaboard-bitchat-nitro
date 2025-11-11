/// <reference types="vite/client" />

/**
 * Environment Configuration
 *
 * CRITICAL: No fallbacks! If an env var is not set, we fail immediately.
 * This prevents silent failures and ensures proper configuration.
 */

// Required environment variables - fail if not set
function getRequiredEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

// BMAP API - for SSE streams, messages, social features
export const API_BASE_URL = getRequiredEnv('VITE_BMAP_API_URL');

// Nitro API - for Droplit proxy with platform auth
export const NITRO_API_URL = getRequiredEnv('VITE_NITRO_API_URL');

// Sigma Auth - for OAuth authentication only
export const SIGMA_AUTH_URL = getRequiredEnv('VITE_SIGMA_AUTH_URL');

// Droplit API - for transaction creation and funding (optional)
export const DROPLIT_API_URL = import.meta.env.VITE_DROPLIT_API_URL;

// Droplit faucet name for BitChat (optional)
export const DROPLIT_FAUCET_NAME = import.meta.env.VITE_DROPLIT_FAUCET_NAME;

// HandCash integration (optional)
export const HANDCASH_APP_ID = import.meta.env.VITE_HANDCASH_APP_ID;
export const HANDCASH_API_URL = import.meta.env.VITE_HANDCASH_API_URL;
