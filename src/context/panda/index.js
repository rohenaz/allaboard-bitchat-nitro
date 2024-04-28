import bsv from "bsv";
import { usePandaWallet } from "panda-wallet-provider";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../../utils/storage";

const wocApiUrl = "https://api.whatsonchain.com/v1/bsv/main";

const PandaContext = React.createContext(undefined);

const getUtxos = async (fromAddress, pullFresh) => {
  try {
    // replace with fetch
    // const { data } = await axios.get(
    //   `${getBaseUrl()}/address/${fromAddress}/unspent`,
    //   config
    // );
    console.log("Getting utxos", { fromAddress, pullFresh });
    const resp = await fetch(`${wocApiUrl}/address/${fromAddress}/unspent`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await resp.json();
    console.log({ data });
    const u = data
      .map((utxo) => {
        return {
          satoshis: utxo.value,
          vout: utxo.tx_pos,
          txid: utxo.tx_hash,
          script: bsv.Script.fromAddress(fromAddress).toASM(),
        };
      })
      .sort((a, b) => (a.satoshis > b.satoshis ? -1 : 1));
    console.log("Setting utxos", u);
    return u;
  } catch (error) {
    console.log(error);
    return [];
  }
};

const AutoPandaProvider = (props) => {
  // export type PandaProviderType = {
  //   isReady: boolean;
  //   connect: () => Promise<PubKeys | undefined>;
  //   disconnect: () => Promise<boolean>;
  //   isConnected: () => Promise<boolean>;
  //   getPubKeys: () => Promise<PubKeys | undefined>;
  //   getAddresses: () => Promise<Addresses | undefined>;
  //   getSocialProfile: () => Promise<SocialProfile | undefined>;
  //   getBalance: () => Promise<Balance | undefined>;
  //   getOrdinals: () => Promise<Ordinal[] | undefined>;
  //   sendBsv: (params: SendBsv[]) => Promise<string | undefined>;
  //   transferOrdinal: (params: TransferOrdinal) => Promise<string | undefined>;
  //   purchaseOrdinal: (params: PurchaseOrdinal) => Promise<string | undefined>;
  //   signMessage: (params: SignMessage) => Promise<SignedMessage | undefined>;
  //   getSignatures: (params: GetSignatures) => Promise<SignatureResponse[] | undefined>;
  //   broadcast: (params: Broadcast) => Promise<string | undefined>;
  //   getExchangeRate: () => Promise<number | undefined>;
  //   getPaymentUtxos: () => Promise<Utxos[] | undefined>;
  // };

  const {
    connect,
    isConnected,
    isReady,
    getSocialProfile,
    getPaymentUtxos,
    getAddresses,
    broadcast,
    getBalance,
    getSignatures,
    sendBsv,
  } = usePandaWallet();
  const [pandaProfile, setPandaProfile] = useLocalStorage(profileStorageKey);
  const [connected, setConnected] = useState(undefined);
  const [utxos, setUtxos] = useState(undefined);

  // Auto Authenticate when extension is available
  useEffect(() => {
    const fire = async () => {
      try {
        const c = await isConnected();
        if (!c && props.autoconnect) {
          await connect();
        }
        setConnected(true);
      } catch (e) {
        setConnected(false);
      }
    };
    if (isReady && connected === undefined) {
      fire();
    }
  }, [isConnected, isReady, connected, connect, props]);

  useEffect(() => {
    const fire = async () => {
      const addresses = await getAddresses();
      console.log("Getting utxos for", addresses.bsvAddress);
      const u = await getUtxos(addresses.bsvAddress, true);
      console.log({ utxos: u });
      setUtxos(u);
      const profile = await getSocialProfile();
      profile.addresses = addresses;
      profile.utxos = u;
      const balance = await getBalance();
      profile.balance = balance;
      setPandaProfile(profile);
    };
    if (connected && !utxos) {
      fire();
    }
  }, [
    connected,
    getSocialProfile,
    setPandaProfile,
    getAddresses,
    utxos,
    getBalance,
  ]);

  const value = useMemo(
    () => ({
      connected,
      pandaProfile,
      utxos,
      broadcast,
      getSignatures,
      sendBsv,
    }),
    [connected, pandaProfile, utxos, broadcast, getSignatures, sendBsv]
  );

  return <PandaContext.Provider value={value} {...props} />;
};

const usePanda = () => {
  const context = useContext(PandaContext);
  if (context === undefined) {
    throw new Error("usePanda must be used within an PandaProvider");
  }
  return context;
};

export { AutoPandaProvider, usePanda };

//
// Utils
//

const profileStorageKey = "nitro__PandaProvider_profile";
