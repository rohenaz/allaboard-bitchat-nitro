/// <reference types="vite/client" />

// BMAP API - for SSE streams, messages, social features
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://bmap-api-production.up.railway.app';

// Nitro API - for Droplit proxy with platform auth
export const NITRO_API_URL =
  import.meta.env.VITE_NITRO_API_URL || 'https://api.bitchatnitro.com';

// Sigma Auth - for OAuth authentication only
export const SIGMA_AUTH_URL =
  import.meta.env.VITE_SIGMA_AUTH_URL || 'https://auth.sigmaidentity.com';

// Droplit API - for transaction creation and funding
export const DROPLIT_API_URL =
  import.meta.env.VITE_DROPLIT_API_URL || 'https://dev-go-faucet-api-mazi.encr.app';

// Droplit faucet name for BitChat
export const DROPLIT_FAUCET_NAME =
  import.meta.env.VITE_DROPLIT_FAUCET_NAME || 'bitchat';

export const HANDCASH_APP_ID = import.meta.env.VITE_HANDCASH_APP_ID;

export const HANDCASH_API_URL =
  import.meta.env.VITE_HANDCASH_API_URL || 'https://api.bitchatnitro.com';
