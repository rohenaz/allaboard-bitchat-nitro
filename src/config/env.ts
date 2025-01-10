/// <reference types="vite/client" />

export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3055';

export const API_ENDPOINT = `${API_BASE_URL}`;

export const HANDCASH_APP_ID = process.env.VITE_HANDCASH_APP_ID;

export const YOURS_APP_ID = process.env.VITE_YOURS_APP_ID;

export const ENVIRONMENT = process.env.NODE_ENV || 'development';

export const HANDCASH_API_URL =
  process.env.VITE_HANDCASH_API_URL || 'https://api.bitchatnitro.com';
