/**
 * Sigma Iframe Signer for Bitchat
 *
 * Provides seamless client-side signing via embedded Sigma iframe.
 * Keys stay in auth.sigmaidentity.com localStorage - never exposed to bitchat.
 *
 * This maintains the exact same transaction building and data structures,
 * only changing HOW signatures are obtained.
 */

import { SIGMA_AUTH_URL } from '../config/constants';

interface SignatureRequest {
  requestId: string;
  requestPath: string;
  body?: string;
  signatureType?: 'bsm' | 'brc77';
  bodyEncoding?: 'utf8' | 'hex' | 'base64';
}

interface SignatureResponse {
  requestId: string;
  authToken: string;
  signingPubkey?: string;
  error?: string;
}

class SigmaIframeSigner {
  private iframe: HTMLIFrameElement | null = null;
  private pendingRequests: Map<string, {
    resolve: (authToken: string) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private initialized = false;
  private boundMessageHandler: ((event: MessageEvent) => void) | null = null;
  private walletLocked = false;

  /**
   * Initialize the Sigma signer iframe
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('SigmaIframeSigner can only be used in browser');
    }

    if (this.initialized) return;

    // Create iframe for Sigma signer (full screen, transparent, hidden until needed)
    // The iframe content will handle its own backdrop/modal styling
    // pointer-events: none by default so clicks pass through to main UI
    // Only set to 'auto' when iframe is actively showing a modal
    this.iframe = document.createElement('iframe');
    this.iframe.src = `${SIGMA_AUTH_URL}/signer`;
    this.iframe.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      background: transparent;
      z-index: 10000;
      display: none;
      pointer-events: none;
    `;
    document.body.appendChild(this.iframe);

    // Set up message listener (store bound handler for proper cleanup)
    this.boundMessageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.boundMessageHandler);

    // Wait for iframe to load
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Sigma iframe load timeout')), 10000);
      if (this.iframe) {
        this.iframe.addEventListener('load', () => {
          clearTimeout(timeout);
          this.initialized = true;
          resolve();
        });
        this.iframe.addEventListener('error', () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load Sigma iframe'));
        });
      }
    });

    console.log('[Sigma Iframe] Signer initialized');
  }

  /**
   * Request signature from Sigma iframe
   */
  async requestSignature(
    requestPath: string,
    body?: object | string,
    signatureType: 'bsm' | 'brc77' = 'brc77'
  ): Promise<string> {
    if (!this.initialized || !this.iframe) {
      throw new Error('Sigma iframe signer not initialized. Call init() first.');
    }

    const startTime = performance.now();
    console.log('[Sigma Iframe] Requesting signature for:', requestPath);

    // Generate unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Prepare request
    const request: SignatureRequest = {
      requestId,
      requestPath,
      signatureType,
    };

    if (body) {
      request.body = typeof body === 'string' ? body : JSON.stringify(body);
      request.bodyEncoding = 'utf8';
    }

    // Create promise for response
    const promise = new Promise<string>((resolve, reject) => {
      // Set timeout (30 seconds)
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        const elapsed = performance.now() - startTime;
        console.error(`[Sigma Iframe] Signature timeout after ${elapsed.toFixed(0)}ms`);
        // Hide iframe on timeout
        if (this.iframe) {
          this.iframe.style.display = 'none';
          this.iframe.style.pointerEvents = 'none';
        }
        reject(new Error('Signature request timeout'));
      }, 30000);

      this.pendingRequests.set(requestId, {
        resolve: (authToken: string) => {
          const elapsed = performance.now() - startTime;
          console.log(`[Sigma Iframe] Signature complete in ${elapsed.toFixed(0)}ms`);
          // Hide iframe after successful signature
          if (this.iframe) {
            this.iframe.style.display = 'none';
            this.iframe.style.pointerEvents = 'none';
          }
          resolve(authToken);
        },
        reject,
        timeout
      });
    });

    // If wallet is already locked, show iframe immediately
    if (this.walletLocked && this.iframe) {
      console.log('[Sigma Iframe] Wallet already locked, showing unlock UI');
      this.iframe.style.display = 'block';
      this.iframe.style.pointerEvents = 'auto';
    }

    // Send request to iframe
    if (this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { type: 'SIGN_REQUEST', payload: request },
        SIGMA_AUTH_URL
      );
    }

    return promise;
  }

  /**
   * Handle messages from Sigma iframe
   */
  private handleMessage(event: MessageEvent): void {
    // Verify origin first - ignore messages from other sources
    if (event.origin !== SIGMA_AUTH_URL) {
      return;
    }

    console.log('[Sigma Iframe] Received message:', event.data?.type, 'from:', event.origin);

    // Handle wallet locked event - always show iframe so user can unlock
    if (event.data?.type === 'WALLET_LOCKED') {
      console.log('[Sigma Iframe] Wallet locked, showing unlock UI');
      this.walletLocked = true;

      // Show iframe so user can unlock their wallet
      if (this.iframe) {
        this.iframe.style.display = 'block';
        this.iframe.style.pointerEvents = 'auto';
      }
      return;
    }

    // Handle wallet unlocked event (hide iframe)
    if (event.data?.type === 'WALLET_UNLOCKED') {
      console.log('[Sigma Iframe] Wallet unlocked, hiding iframe');
      this.walletLocked = false;
      if (this.iframe) {
        this.iframe.style.display = 'none';
        this.iframe.style.pointerEvents = 'none';
      }
      return;
    }

    // Only handle signature responses
    if (event.data?.type !== 'SIGN_RESPONSE') {
      return;
    }

    const response: SignatureResponse = event.data.payload;
    const pending = this.pendingRequests.get(response.requestId);

    if (!pending) {
      console.warn('[Sigma Iframe] Received response for unknown request:', response.requestId);
      return;
    }

    // Clear timeout
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.requestId);

    // Resolve or reject
    if (response.error) {
      console.error('[Sigma Iframe] Signature error:', response.error);
      // Hide iframe on error
      if (this.iframe) {
        this.iframe.style.display = 'none';
        this.iframe.style.pointerEvents = 'none';
      }
      pending.reject(new Error(response.error));
    } else {
      console.log('[Sigma Iframe] Signature received from iframe');

      // Note: Bitchat doesn't need pubkey registration (that was for Droplit faucets)
      // Just resolve with the auth token immediately
      if (response.signingPubkey) {
        console.log('[Sigma Iframe] Received signing pubkey:', response.signingPubkey);
      }
      pending.resolve(response.authToken);
    }
  }

  /**
   * Check if signer is ready
   */
  isReady(): boolean {
    return this.initialized && this.iframe !== null;
  }

  /**
   * Cleanup - remove iframe and listeners
   */
  destroy(): void {
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }
    if (this.boundMessageHandler) {
      window.removeEventListener('message', this.boundMessageHandler);
      this.boundMessageHandler = null;
    }
    this.initialized = false;

    // Reject all pending requests
    for (const { reject, timeout } of this.pendingRequests.values()) {
      clearTimeout(timeout);
      reject(new Error('Signer destroyed'));
    }
    this.pendingRequests.clear();
  }
}

// Singleton instance
let signerInstance: SigmaIframeSigner | null = null;

/**
 * Get or create the global Sigma iframe signer instance
 */
export function getSigmaIframeSigner(): SigmaIframeSigner {
  if (!signerInstance) {
    signerInstance = new SigmaIframeSigner();
  }
  return signerInstance;
}

/**
 * Initialize Sigma iframe signer (call once on app startup)
 */
export async function initSigmaIframeSigner(): Promise<void> {
  const signer = getSigmaIframeSigner();
  await signer.init();
}

/**
 * Request signature from Sigma iframe
 * Convenience wrapper around getSigmaIframeSigner().requestSignature()
 */
export async function requestSigmaSignature(
  requestPath: string,
  body?: object | string,
  signatureType: 'bsm' | 'brc77' = 'brc77'
): Promise<string> {
  const signer = getSigmaIframeSigner();
  if (!signer.isReady()) {
    await signer.init();
  }
  return signer.requestSignature(requestPath, body, signatureType);
}
