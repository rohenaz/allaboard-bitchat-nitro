import { Transaction, Script, Utils } from '@bsv/sdk';
import { SIGMA_AUTH_URL, NITRO_API_URL } from '../config/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Unified transaction sending flow using Droplit + Sigma AIP Signer
 *
 * Flow:
 * 1. Get OP_RETURN template from nitro-api /droplit/push (fillInputs: false)
 * 2. Sign OP_RETURN data via Sigma iframe with user's BAP identity
 * 3. Replace template OP_RETURN with signed data
 * 4. Fund and broadcast via nitro-api /droplit/fund
 *
 * Note: nitro-api handles platform authentication with BITCHAT_MEMBER_WIF
 */

interface SendTransactionOptions {
  dataPayload: string[]; // UTF-8 strings
  broadcast?: boolean; // Default: false (for testing)
}

interface SignerIframeResponse {
  type: string;
  payload: {
    requestId: string;
    signedOps?: number[][];
    error?: string;
  };
}

let signerIframe: HTMLIFrameElement | null = null;
let isSignerReady = false;

/**
 * Get or create the Sigma signer iframe
 */
function getSignerIframe(): HTMLIFrameElement {
  if (signerIframe && document.body.contains(signerIframe)) {
    return signerIframe;
  }

  // Create new iframe - full screen overlay, hidden until needed
  const iframe = document.createElement('iframe');
  iframe.src = `${SIGMA_AUTH_URL}/signer`;
  iframe.style.cssText = `
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

  document.body.appendChild(iframe);
  signerIframe = iframe;

  return iframe;
}

/**
 * Wait for signer iframe to be ready
 */
function waitForSignerReady(): Promise<void> {
  if (isSignerReady) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Signer iframe timeout'));
    }, 10000);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(SIGMA_AUTH_URL).origin) return;

      if (event.data.type === 'WALLET_UNLOCKED') {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
        isSignerReady = true;

        // Hide iframe after unlock
        if (signerIframe) {
          signerIframe.style.display = 'none';
          signerIframe.style.pointerEvents = 'none';
        }

        console.log('[sendTransaction] Wallet unlocked, iframe hidden');
        resolve();
      } else if (event.data.type === 'WALLET_LOCKED') {
        console.log('[sendTransaction] Wallet locked - showing unlock UI');

        // Show iframe so user can unlock their wallet
        if (signerIframe) {
          signerIframe.style.display = 'block';
          signerIframe.style.pointerEvents = 'auto';
        }

        // Don't reject - wait for user to unlock
        // The timeout will handle if they take too long
      }
    };

    window.addEventListener('message', handleMessage);
  });
}

/**
 * Request AIP signature from Sigma signer iframe
 * Note: Signer determines which identity to use from localStorage (set during OAuth login)
 */
async function requestAIPSignature(hexArray: string[]): Promise<number[][]> {
  const iframe = getSignerIframe();
  await waitForSignerReady();

  return new Promise((resolve, reject) => {
    const requestId = uuidv4();

    // Log what we're requesting signature for
    console.log('[sendTransaction] Requesting AIP signature:', {
      requestId,
      dataPartsCount: hexArray.length,
      dataPreview: hexArray.map(h => h.substring(0, 40) + '...'),
    });

    // Check what identity is stored locally (should match what iframe has)
    try {
      const storedUser = localStorage.getItem('sigma_current_user');
      const selectedIdentity = localStorage.getItem('sigma_selected_identity');
      console.log('[sendTransaction] Local identity info:', {
        hasStoredUser: !!storedUser,
        userBapId: storedUser ? JSON.parse(storedUser).bap_id : 'none',
        hasSelectedIdentity: !!selectedIdentity,
        selectedBapId: selectedIdentity ? JSON.parse(selectedIdentity).bapId : 'none'
      });
    } catch (e) {
      console.error('[sendTransaction] Failed to read local identity:', e);
    }

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleResponse);
      console.error('[sendTransaction] AIP signing timeout - no response from Sigma iframe after 30s');
      reject(new Error('AIP signing timeout'));
    }, 30000);

    const handleResponse = (event: MessageEvent<SignerIframeResponse>) => {
      if (event.origin !== new URL(SIGMA_AUTH_URL).origin) return;
      if (event.data.type !== 'SIGN_AIP_RESPONSE') return;
      if (event.data.payload.requestId !== requestId) return;

      console.log('[sendTransaction] Received AIP signature response:', {
        requestId: event.data.payload.requestId,
        hasError: !!event.data.payload.error,
        hasSignedOps: !!event.data.payload.signedOps,
        signedOpsCount: event.data.payload.signedOps?.length || 0
      });

      clearTimeout(timeout);
      window.removeEventListener('message', handleResponse);

      if (event.data.payload.error) {
        console.error('[sendTransaction] AIP signing failed:', event.data.payload.error);
        reject(new Error(event.data.payload.error));
      } else if (event.data.payload.signedOps) {
        console.log('[sendTransaction] AIP signature successful');
        resolve(event.data.payload.signedOps);
      } else {
        console.error('[sendTransaction] Invalid AIP response - no error and no signedOps');
        reject(new Error('Invalid response from signer'));
      }
    };

    window.addEventListener('message', handleResponse);

    // Send signing request
    iframe.contentWindow?.postMessage({
      type: 'SIGN_AIP_REQUEST',
      payload: {
        requestId,
        hexArray,
      },
    }, SIGMA_AUTH_URL);
  });
}

/**
 * Send transaction using Droplit + Sigma flow
 */
export async function sendTransaction(options: SendTransactionOptions): Promise<{ txid: string; rawtx?: string }> {
  const { dataPayload, broadcast = false } = options;

  console.log('[sendTransaction] Starting transaction flow', { dataCount: dataPayload.length, broadcast });

  // Step 1: Get OP_RETURN template from nitro-api (proxies to Droplit with platform auth)
  console.log('[sendTransaction] Step 1: Requesting template from nitro-api /droplit/push');

  const templateResp = await fetch(`${NITRO_API_URL}/droplit/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: dataPayload,
      encoding: 'utf8',
      fillInputs: false,
      broadcast: false,
    }),
  });

  if (!templateResp.ok) {
    const errorText = await templateResp.text();
    console.error('[sendTransaction] Template request failed:', errorText);
    throw new Error(`Droplit template request failed: ${templateResp.statusText}`);
  }

  const templateData = await templateResp.json();
  const templateHex = templateData.rawtx;
  console.log('[sendTransaction] STEP 1 - Template BEFORE signing (OP_RETURN placeholder):', templateHex);

  // Step 2: Sign via Sigma iframe
  console.log('[sendTransaction] Step 2: Requesting AIP signature from signer');
  const hexArray = dataPayload.map(s => Utils.toHex(Utils.toArray(s, 'utf8')));
  const signedOps = await requestAIPSignature(hexArray);
  console.log('[sendTransaction] Signature received:', signedOps.length, 'parts');

  // Step 3: Replace OP_RETURN in template with signed data
  console.log('[sendTransaction] Step 3: Replacing OP_RETURN with signed data');
  const tx = Transaction.fromHex(templateHex);

  if (tx.outputs.length !== 1) {
    throw new Error(`Expected 1 output in template, got ${tx.outputs.length}`);
  }

  // Convert signedOps to hex strings
  const signedHexArray = signedOps.map(bytes => Utils.toHex(bytes));

  // Replace OP_RETURN output with signed script
  tx.outputs[0].lockingScript = Script.fromASM(`OP_0 OP_RETURN ${signedHexArray.join(' ')}`);

  const signedTemplateHex = tx.toHex();
  console.log('[sendTransaction] STEP 2 - AFTER AIP signing (with user identity signature):', signedTemplateHex);

  // Step 4: Fund and broadcast via nitro-api (proxies to Droplit with platform auth)
  console.log('[sendTransaction] Step 4: Funding via nitro-api /droplit/fund (broadcast:', broadcast, ')');

  const fundResp = await fetch(`${NITRO_API_URL}/droplit/fund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rawtx: signedTemplateHex,
      broadcast,
    }),
  });

  if (!fundResp.ok) {
    const errorText = await fundResp.text();
    console.error('[sendTransaction] Fund request failed:', errorText);
    throw new Error(`Droplit fund request failed: ${fundResp.statusText}`);
  }

  const fundData = await fundResp.json();
  console.log('[sendTransaction] STEP 3 - AFTER Droplit funding (inputs filled, ready to broadcast):', fundData.rawtx);
  console.log('[sendTransaction] Transaction complete - TXID:', fundData.txid);

  return {
    txid: fundData.txid,
    rawtx: fundData.rawtx,
  };
}
