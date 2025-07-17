interface SigmaAuthConfig {
  clientId: string;
  issuerUrl: string;
  redirectUri: string;
  storageKey?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

interface SigmaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface SigmaUserInfo {
  sub: string;
  paymail: string;
  address: string;
  avatar?: string;
  displayName?: string;
  publicKey?: string;
}

interface SigmaAuthState {
  state: string;
  timestamp: number;
  provider: string;
}

interface SigmaSession {
  accessToken: string;
  userInfo: SigmaUserInfo;
  expiresAt: number;
  createdAt: number;
}

class SigmaAuth {
  private config: SigmaAuthConfig;
  private readonly STATE_KEY = 'sigma-auth-state';
  private readonly SESSION_KEY = 'sigma-auth-session';

  constructor(config: SigmaAuthConfig) {
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      storageKey: 'sigma-auth',
      ...config,
    };
  }

  /**
   * Generate a secure random state parameter
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store auth state in session storage
   */
  private storeAuthState(state: string): void {
    const authState: SigmaAuthState = {
      state,
      timestamp: Date.now(),
      provider: 'sigma'
    };
    sessionStorage.setItem(this.STATE_KEY, JSON.stringify(authState));
  }

  /**
   * Retrieve and validate auth state from session storage
   */
  private validateAuthState(receivedState: string): boolean {
    try {
      const storedData = sessionStorage.getItem(this.STATE_KEY);
      if (!storedData) return false;

      const authState: SigmaAuthState = JSON.parse(storedData);
      
      // Check if state matches
      if (authState.state !== receivedState) return false;
      
      // Check if state is not too old (10 minutes)
      const maxAge = 10 * 60 * 1000; // 10 minutes
      if (Date.now() - authState.timestamp > maxAge) return false;

      // Clean up after validation
      sessionStorage.removeItem(this.STATE_KEY);
      return true;
    } catch (error) {
      console.error('Error validating auth state:', error);
      return false;
    }
  }

  /**
   * Store session in local storage
   */
  private storeSession(session: SigmaSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Retrieve session from local storage
   */
  getStoredSession(): SigmaSession | null {
    try {
      const storedData = localStorage.getItem(this.SESSION_KEY);
      if (!storedData) return null;

      const session: SigmaSession = JSON.parse(storedData);
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  }

  /**
   * Clear stored session
   */
  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.STATE_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getStoredSession() !== null;
  }

  /**
   * Get current user info if authenticated
   */
  getCurrentUser(): SigmaUserInfo | null {
    const session = this.getStoredSession();
    return session ? session.userInfo : null;
  }

  /**
   * Retry helper for network requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`${context} failed (attempt ${attempt}/${this.config.retryAttempts}):`, lastError.message);
        
        if (attempt < this.config.retryAttempts!) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay! * attempt));
        }
      }
    }
    
    throw new Error(`${context} failed after ${this.config.retryAttempts} attempts: ${lastError!.message}`);
  }

  /**
   * Redirect user to Sigma Identity authorization page
   */
  authorize(): void {
    try {
      // Generate and store state parameter for security
      const state = this.generateState();
      this.storeAuthState(state);

      const authUrl = new URL(`${this.config.issuerUrl}/authorize`);
      authUrl.searchParams.set('client_id', this.config.clientId);
      authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('provider', 'sigma');
      authUrl.searchParams.set('scope', 'openid profile');
      authUrl.searchParams.set('state', state);

      console.log('Redirecting to authorization URL:', authUrl.toString());
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Error during authorization:', error);
      throw new Error('Failed to initiate authorization');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<SigmaTokenResponse> {
    return this.retryRequest(async () => {
      const tokenUrl = `${this.config.issuerUrl}/token`;

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        let errorMessage = `Token exchange failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
            if (errorData.error_description) {
              errorMessage += `: ${errorData.error_description}`;
            }
          }
        } catch (parseError) {
          // Ignore parse errors, use original message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    }, 'Token exchange');
  }

  /**
   * Fetch user information using access token
   */
  async getUserInfo(accessToken: string): Promise<SigmaUserInfo> {
    return this.retryRequest(async () => {
      const userInfoUrl = `${this.config.issuerUrl}/userinfo`;

      const response = await fetch(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to fetch user info: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch (parseError) {
          // Ignore parse errors, use original message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    }, 'User info fetch');
  }

  /**
   * Handle OAuth callback and return user information
   */
  async handleCallback(code: string, state?: string): Promise<SigmaUserInfo> {
    try {
      // Validate state parameter if provided
      if (state && !this.validateAuthState(state)) {
        throw new Error('Invalid or expired state parameter');
      }

      const tokenResponse = await this.exchangeCodeForToken(code);
      const userInfo = await this.getUserInfo(tokenResponse.access_token);

      // Store session for future use
      const session: SigmaSession = {
        accessToken: tokenResponse.access_token,
        userInfo,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
        createdAt: Date.now(),
      };

      this.storeSession(session);
      console.log('Session stored successfully');

      return userInfo;
    } catch (error) {
      console.error('OAuth callback error:', error);
      // Clean up any stored state on error
      this.clearSession();
      throw error;
    }
  }

  /**
   * Logout user and clear session
   */
  logout(): void {
    this.clearSession();
    console.log('User logged out, session cleared');
  }

  /**
   * Refresh session if possible
   */
  async refreshSession(): Promise<boolean> {
    const session = this.getStoredSession();
    if (!session) return false;

    try {
      // Try to fetch fresh user info with existing token
      const userInfo = await this.getUserInfo(session.accessToken);
      
      // Update session with fresh data
      const refreshedSession: SigmaSession = {
        ...session,
        userInfo,
      };
      
      this.storeSession(refreshedSession);
      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      this.clearSession();
      return false;
    }
  }
}

// Create singleton instance
export const sigmaAuth = new SigmaAuth({
  clientId: import.meta.env.VITE_SIGMA_CLIENT_ID || 'bitchat-nitro',
  issuerUrl:
    import.meta.env.VITE_SIGMA_ISSUER_URL || 'https://auth.sigmaidentity.com',
  redirectUri: `${window.location.origin}/auth/sigma/callback`,
  retryAttempts: 3,
  retryDelay: 1000,
});

export type { SigmaUserInfo, SigmaTokenResponse, SigmaSession, SigmaAuthState };
