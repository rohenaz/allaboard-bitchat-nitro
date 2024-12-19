import { API_BASE_URL } from '../config/env';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  requiresAuth?: boolean;
}

interface SSEOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, requiresAuth = true, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
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
    console.log('SSE Connection opened');
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
    const { requiresAuth = true, params } = options;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (requiresAuth && options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    const url = `${API_BASE_URL}${path}${queryString}`;

    console.log('Making API request:', {
      method: 'GET',
      url,
      requiresAuth,
      hasToken: !!options.token,
    });

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('API response:', {
        status: response.status,
        url,
        dataType: typeof data,
        isArray: Array.isArray(data),
        sampleData: Array.isArray(data) ? data.slice(0, 2) : data,
      });
      return data as T;
    } catch (error) {
      console.error('API request failed:', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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
