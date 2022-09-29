import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Script from "react-load-script";
import { lsTest, useLocalStorage } from "../../utils/storage";

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
  const [relayOtc, setRelayOtc] = useState();
  const [runOwner, setRunOwner] = useLocalStorage(runOwnerStorageKey);

  const [ready, setReady] = useState(false);

  const isApp = useMemo(
    () => (relayOne && relayOne.isApp()) || false,
    [relayOne]
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
    console.log("relay script loaded", window.relayone);
    setRelayOne(window.relayone);
    setRelayOtc(window.relayotc);
    setReady(true);
  }, [setRelayOne, setReady, setRelayOtc]);

  const value = useMemo(
    () => ({
      relayOne,
      relayOtc,
      setPaymail,
      paymail,
      authenticate,
      authenticated: !!paymail,
      ready,
      isApp,
      runOwner,
    }),
    [
      relayOne,
      relayOtc,
      setPaymail,
      paymail,
      authenticate,
      ready,
      isApp,
      runOwner,
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
