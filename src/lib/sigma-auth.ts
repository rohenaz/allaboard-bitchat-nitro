interface SigmaAuthConfig {
  clientId: string;
  issuerUrl: string;
  redirectUri: string;
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

class SigmaAuth {
  private config: SigmaAuthConfig;

  constructor(config: SigmaAuthConfig) {
    this.config = config;
  }

  /**
   * Redirect user to Sigma Identity authorization page
   */
  authorize(): void {
    const authUrl = new URL(`${this.config.issuerUrl}/authorize`);
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('provider', 'sigma');
    authUrl.searchParams.set('scope', 'openid profile');

    window.location.href = authUrl.toString();
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<SigmaTokenResponse> {
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
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch user information using access token
   */
  async getUserInfo(accessToken: string): Promise<SigmaUserInfo> {
    const userInfoUrl = `${this.config.issuerUrl}/userinfo`;

    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Handle OAuth callback and return user information
   */
  async handleCallback(code: string): Promise<SigmaUserInfo> {
    const tokenResponse = await this.exchangeCodeForToken(code);
    const userInfo = await this.getUserInfo(tokenResponse.access_token);

    return userInfo;
  }
}

// Create singleton instance
export const sigmaAuth = new SigmaAuth({
  clientId: import.meta.env.VITE_SIGMA_CLIENT_ID || 'bitchat-nitro',
  issuerUrl:
    import.meta.env.VITE_SIGMA_ISSUER_URL || 'https://auth.sigmaidentity.com',
  redirectUri: `${window.location.origin}/auth/sigma/callback`,
});

export type { SigmaUserInfo, SigmaTokenResponse };
