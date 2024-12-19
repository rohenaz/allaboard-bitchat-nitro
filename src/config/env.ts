export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:3055';

export const API_ENDPOINT = `${API_BASE_URL}`;

export const HANDCASH_APP_ID =
  import.meta.env.VITE_HANDCASH_APP_ID || process.env.REACT_APP_HANDCASH_APP_ID;

export const YOURS_APP_ID =
  import.meta.env.VITE_YOURS_APP_ID || process.env.REACT_APP_YOURS_APP_ID;

export const ENVIRONMENT =
  import.meta.env.MODE || process.env.NODE_ENV || 'development';
