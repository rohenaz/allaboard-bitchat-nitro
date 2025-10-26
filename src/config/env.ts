/// <reference types="vite/client" />

// BMAP API - for SSE streams, messages, social features
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://bmap-api-production.up.railway.app';

// Sigma Auth - for OAuth authentication only
export const SIGMA_AUTH_URL =
  import.meta.env.VITE_SIGMA_AUTH_URL || 'https://auth.sigmaidentity.com';

export const HANDCASH_APP_ID = import.meta.env.VITE_HANDCASH_APP_ID;

export const HANDCASH_API_URL =
  import.meta.env.VITE_HANDCASH_API_URL || 'https://api.bitchatnitro.com';
