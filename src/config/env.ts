/// <reference types="vite/client" />

export const API_BASE_URL =
  import.meta.env.API_URL || 'http://localhost:3055';

export const API_ENDPOINT = `${API_BASE_URL}`;

export const HANDCASH_APP_ID = import.meta.env.VITE_HANDCASH_APP_ID;

export const YOURS_APP_ID = import.meta.env.VITE_YOURS_APP_ID;

export const ENVIRONMENT = import.meta.env.MODE || 'development';

export const HANDCASH_API_URL =
  import.meta.env.VITE_HANDCASH_API_URL || 'https://api.bitchatnitro.com';
