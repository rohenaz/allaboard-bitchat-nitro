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

  // Create new iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `${SIGMA_AUTH_URL}/signer`;

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
        resolve();
      } else if (event.data.type === 'WALLET_LOCKED') {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
        reject(new Error('Wallet is locked. Please unlock your wallet in the Sigma signer.'));
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
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleResponse);
      reject(new Error('AIP signing timeout'));
    }, 30000);

    const handleResponse = (event: MessageEvent<SignerIframeResponse>) => {
      if (event.origin !== new URL(SIGMA_AUTH_URL).origin) return;
      if (event.data.type !== 'SIGN_AIP_RESPONSE') return;
      if (event.data.payload.requestId !== requestId) return;

      clearTimeout(timeout);
      window.removeEventListener('message', handleResponse);

      if (event.data.payload.error) {
        reject(new Error(event.data.payload.error));
      } else if (event.data.payload.signedOps) {
        resolve(event.data.payload.signedOps);
      } else {
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
  console.log('[sendTransaction] Template received:', templateHex.substring(0, 100) + '...');

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
  console.log('[sendTransaction] Signed template:', signedTemplateHex.substring(0, 100) + '...');

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
  console.log('[sendTransaction] Transaction complete:', fundData.txid);

  if (!broadcast && fundData.rawtx) {
    console.log('[sendTransaction] Final transaction hex (not broadcast):', fundData.rawtx);
  }

  return {
    txid: fundData.txid,
    rawtx: fundData.rawtx,
  };
}
