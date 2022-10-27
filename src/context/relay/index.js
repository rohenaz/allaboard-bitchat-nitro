import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Script from "react-load-script";
import { FetchStatus } from "../../utils/common";
import { lsTest, useLocalStorage } from "../../utils/storage";
import { MAP_PREFIX } from "../bitcoin";

// export interface RelaySignResult {
//   algorithm: 'bitcoin-signed-message';
//   key: 'identity';
//   data: string; // data you passed in
//   value: string; // signature
// }

// export interface RelayBroadcastResponse {
//   amount: number;
//   currency: string;
//   identity: string;
//   paymail: string; // sender paymail
//   rawTx: string;
//   satoshis: number;
//   txid: string;
// }

// interface RelayOneAlpha {
//   run: RelayOneRun;
//   dex: RelayOneDex;
// }

// interface RelayOneDex {
//   getDexKey: () => Promise<string>;
//   pay: (tx: string) => Promise<any>; // TODO: These can take bsv.Transaction as well
//   sign: (tx: string) => Promise<any>; // TODO: These can take bsv.Transaction as well
// }
// interface RelayOneRun {
//   getOwner: () => Promise<string>;
//   getLegacyOwner: () => Promise<string>;
// }

// interface RenderProps {
//   to: string;
//   amount: string;
//   currency: string;
//   editable?: boolean;
//   opReturn?: string | string[];
//   onPayment?: (response: RelayBroadcastResponse) => void;
// }
// interface RelayOne {
//   authBeta: () => Promise<string>;
//   send: (payload: any) => Promise<RelayBroadcastResponse>;
//   quote: (payload: any) => Promise<string>;
//   sign: (payload: string) => Promise<RelaySignResult>;
//   isApp: () => boolean;
//   render: (ele: HTMLDivElement, props: RenderProps) => void;
//   alpha: RelayOneAlpha;
// } // TODO: Complete

// // 'relay-container', { to: Current.campaign.funding_address }
// type RelayOtcOptions = {
//   to: string;
// };

// interface RelayOtc {
//   buy: (container: string, options: RelayOtcOptions) => void;
// } // TODO: Complete

// type ContextValue = {
//   relayOne: RelayOne | undefined;
//   relayOtc: RelayOtc | undefined;
//   paymail: string | undefined;
//   authenticate: () => Promise<void>;
//   authenticated: boolean;
//   ready: boolean;
//   isApp: boolean;
//   setPaymail: (paymail: string | undefined) => void;
//   runOwner: string | undefined;
// };

const RelayContext = React.createContext(undefined);

const RelayProvider = (props) => {
  const [paymail, setPaymail] = useLocalStorage(paymailStorageKey);
  const [relayOne, setRelayOne] = useState();
  const [runOwner, setRunOwner] = useLocalStorage(runOwnerStorageKey);

  const [relayEncryptStatus, setRelayEncryptStatus] = useState(
    FetchStatus.Idle
  );
  const [relayDecryptStatus, setRelayDecryptStatus] = useState(
    FetchStatus.Idle
  );

  const [ready, setReady] = useState(false);

  const isApp = useMemo(
    () => (relayOne && relayOne.isApp()) || false,
    [relayOne]
  );

  // encrypts a STRING
  const relayEncrypt = useCallback(
    async (data) => {
      if (typeof data === "object") {
        data = JSON.stringify(data);
      }
      return new Promise((resolve, reject) => {
        if (!relayOne) {
          console.info({ relayOne, w: window.relayone });
          reject(new Error("Relay script not yet loaded!"));
          return;
        }
        if (!paymail) {
          reject(new Error("Paymail not available!"));
          return;
        }

        // Relay requires the data is prefixed with a whitelisted Bitcom prefix
        relayOne
          ?.encrypt(`${MAP_PREFIX}${data}`, paymail, "utf-8")
          .then((resp) => {
            // interface EncryptResult {
            //   algorithm: "electrum-ecies";
            //   key: "identity";
            //   value: string; // hex encoded encrypted data
            //   publicKey: string; // pki
            //   paymail: string; // paymail you passed
            // }
            console.log("encrypted data response", resp);
            resolve({ encryptedData: resp.value });
          })
          .catch((e) => {
            console.error(e);
            reject(e);
          });
      });
    },
    [relayOne, paymail]
  );

  const relayDecrypt = useCallback(
    async (data) => {
      return new Promise((resolve, reject) => {
        if (!relayOne) {
          console.info({ relayOne, w: window.relayone });
          reject(new Error("Relay script not yet loaded!"));
          return;
        }
        if (!paymail) {
          reject(new Error("Paymail not available!"));
          return;
        }
        relayOne
          ?.decrypt(data)
          .then((resp) => {
            console.log("decrypted data", resp);

            // interface DecryptResult {
            //   algorithm: "electrum-ecies";
            //   key: "identity";
            //   data: string; // message you passed
            //   value: string; // decrypted data
            //   publicKey: string; // pki
            // }

            // remove the MAP prefix from the data

            const d = resp.value.slice(MAP_PREFIX.length);
            resolve(JSON.parse(d));
          })
          .catch((e) => {
            console.error(e);
            reject(e);
          });
      });
    },
    [relayOne, paymail]
  );

  const authenticate = useCallback(async () => {
    if (!relayOne) {
      console.info({ relayOne, w: window.relayone });
      throw new Error("Relay script not yet loaded!");
    }

    // Test localStorage is accessible
    if (!lsTest()) {
      throw new Error("localStorage is not available");
    }

    const token = await relayOne.authBeta();

    if (token && !token.error) {
      const payloadBase64 = token.split(".")[0]; // Token structure: "payloadBase64.signature"
      const { paymail: returnedPaymail } = JSON.parse(atob(payloadBase64));
      // localStorage.setItem('paymail', returnedPaymail);
      setPaymail(returnedPaymail);
      const owner = await relayOne?.alpha.run.getOwner();
      setRunOwner(owner);
    } else {
      throw new Error(
        "If you are in private browsing mode try again in a normal browser window. (Relay requires localStorage)"
      );
    }
  }, [relayOne, setPaymail, setRunOwner]);

  // Auto Authenticate when inside the Relay app
  useEffect(() => {
    if (isApp) {
      authenticate();
    }
  }, [authenticate, isApp]);

  const handleScriptLoad = useCallback(() => {
    console.log("script loaded!", window.relayone);
    setRelayOne(window.relayone);
    setReady(true);
  }, [setRelayOne, setReady]);

  const value = useMemo(
    () => ({
      relayOne,
      setPaymail,
      paymail,
      authenticate,
      authenticated: !!paymail,
      ready,
      isApp,
      runOwner,
      relayEncrypt,
      relayDecrypt,
      relayEncryptStatus,
      relayDecryptStatus,
    }),
    [
      relayOne,
      setPaymail,
      paymail,
      authenticate,
      ready,
      isApp,
      runOwner,
      relayEncrypt,
      relayDecrypt,
      relayEncryptStatus,
      relayDecryptStatus,
    ]
  );

  return (
    <>
      <Script
        url={`/js/relayone.js`}
        crossOrigin="anonymous"
        onLoad={handleScriptLoad}
      />
      <RelayContext.Provider value={value} {...props} />
    </>
  );
};

const useRelay = () => {
  const context = useContext(RelayContext);
  if (context === undefined) {
    throw new Error("useRelay must be used within an RelayProvider");
  }
  return context;
};

export { RelayProvider, useRelay };

//
// Utils
//

const paymailStorageKey = "nitro__RelayProvider_paymail";
const runOwnerStorageKey = "nitro__RelayProvider_runOwner";
