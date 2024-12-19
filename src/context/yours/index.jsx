import { P2PKH } from '@bsv/sdk';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useYoursWallet } from 'yours-wallet-provider';
import { useLocalStorage } from '../../utils/storage';

const wocApiUrl = 'https://api.whatsonchain.com/v1/bsv/main';

const YoursContext = React.createContext(undefined);

const getUtxos = async (fromAddress, _pullFresh) => {
  try {
    const resp = await fetch(`${wocApiUrl}/address/${fromAddress}/unspent`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await resp.json();
    const u = data
      .map((utxo) => {
        return {
          satoshis: utxo.value,
          vout: utxo.tx_pos,
          txid: utxo.tx_hash,
          script: new P2PKH().lock(fromAddress).toASM(),
        };
      })
      .sort((a, b) => (a.satoshis > b.satoshis ? -1 : 1));
    return u;
  } catch (_error) {
    return [];
  }
};

const AutoYoursProvider = (props) => {
  // export type YoursProviderType = {
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
    getAddresses,
    broadcast,
    getBalance,
    getSignatures,
    sendBsv,
  } = useYoursWallet();
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
      } catch (_e) {
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
      const u = await getUtxos(addresses.bsvAddress, true);
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
      isReady,
      getSocialProfile,
      getAddresses,
      broadcast,
      sendBsv,
      utxos,
      getSignatures,
    }),
    [
      connected,
      pandaProfile,
      isReady,
      getSocialProfile,
      getAddresses,
      broadcast,
      sendBsv,
      utxos,
      getSignatures,
    ],
  );

  return <YoursContext.Provider value={value} {...props} />;
};

const useYours = () => {
  const context = useContext(YoursContext);
  if (context === undefined) {
    throw new Error('useYours must be used within a YoursProvider');
  }
  return context;
};

export { AutoYoursProvider, useYours };

//
// Utils
//

const profileStorageKey = 'nitro__YoursProvider_profile';
