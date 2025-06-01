/// <reference types="vite/client" />

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://bmap-api-production.up.railway.app';

export const HANDCASH_APP_ID = import.meta.env.VITE_HANDCASH_APP_ID;

export const HANDCASH_API_URL =
  import.meta.env.VITE_HANDCASH_API_URL || 'https://api.bitchatnitro.com';
