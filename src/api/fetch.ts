import { API_BASE_URL } from '../config/env';
import { requestSigmaSignature } from '../lib/sigma-iframe-signer';

type RequestInit = globalThis.RequestInit;
type HeadersInit = globalThis.HeadersInit;
type Event = globalThis.Event;

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  requiresAuth?: boolean;
  token?: string;
  useSigmaAuth?: boolean; // Use Sigma iframe signing instead of Bearer token
}

interface SSEOptions {
  onMessage?: (data: unknown) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
}

interface RequestOptions {
  requiresAuth?: boolean;
  params?: Record<string, string>;
  token?: string;
  useSigmaAuth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, requiresAuth = true, token, useSigmaAuth = true, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add authentication header
  if (requiresAuth) {
    if (useSigmaAuth) {
      // Use Sigma iframe signing (Bitcoin signature-based auth)
      try {
        const requestBody = options.body ? String(options.body) : undefined;
        const authToken = await requestSigmaSignature(
          path,
          requestBody,
          'brc77'
        );
        headers['X-Auth-Token'] = authToken;
      } catch (error) {
        console.error('[Bitchat] Sigma signing failed:', error);
        throw new Error('Failed to sign request with Sigma');
      }
    } else if (token) {
      // Fallback to provided token
      headers['X-Auth-Token'] = token;
    } else {
      // Legacy: Try stored access token
      const accessToken = localStorage.getItem('sigma_access_token');
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
    }
  }

  try {
    const response = await fetch(url, {
      headers,
      mode: 'cors',
      credentials: 'include',
      ...fetchOptions,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch error: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Request Failed:', {
      url,
      method: options.method || 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export function connectSSE(path: string, options: SSEOptions = {}) {
  const url = `${API_BASE_URL}${path}`;
  const eventSource = new EventSource(url, { withCredentials: true });

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      options.onMessage?.(data);
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    options.onError?.(error);
  };

  eventSource.onopen = () => {
    options.onOpen?.();
  };

  return {
    close: () => {
      eventSource.close();
    },
  };
}

export const api = {
  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = true, params, useSigmaAuth = true } = options;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (requiresAuth) {
      if (useSigmaAuth) {
        // Use Sigma iframe signing
        try {
          const authToken = await requestSigmaSignature(path, undefined, 'brc77');
          headers['X-Auth-Token'] = authToken;
        } catch (error) {
          console.error('[Bitchat] Sigma signing failed:', error);
          throw new Error('Failed to sign request with Sigma');
        }
      } else if (options.token) {
        headers['X-Auth-Token'] = options.token;
      } else {
        // Legacy: Try stored access token
        const accessToken = localStorage.getItem('sigma_access_token');
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }
      }
    }

    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    const url = `${API_BASE_URL}${path}${queryString}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as T;
  },

  post: <T>(path: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(path: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'DELETE',
    }),

  sse: connectSSE,
};
