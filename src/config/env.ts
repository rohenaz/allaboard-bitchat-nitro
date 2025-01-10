/// <reference types="vite/client" />
import Bun from 'bun';

export const API_BASE_URL = Bun.env.API_URL || 'http://localhost:3055';

export const API_ENDPOINT = `${API_BASE_URL}`;

export const HANDCASH_APP_ID = Bun.env.HANDCASH_APP_ID;

export const YOURS_APP_ID = Bun.env.YOURS_APP_ID;

export const ENVIRONMENT = Bun.env.NODE_ENV || 'development';

export const HANDCASH_API_URL =
  Bun.env.HANDCASH_API_URL || 'https://api.bitchatnitro.com';
