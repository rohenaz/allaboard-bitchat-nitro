import { P2PKH } from '@bsv/sdk';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  type Addresses,
  type SocialProfile as BaseSocialProfile,
  type SignatureResponse,
  type Utxo,
  useYoursWallet,
} from 'yours-wallet-provider';
import { setYoursUser } from '../../reducers/sessionReducer';
import { FetchStatus } from '../../utils/common';

const wocApiUrl = 'https://api.whatsonchain.com/v1/bsv/main';
const profileStorageKey = 'nitro__YoursProvider_profile';

// Base types from yours-wallet-provider
export type { Addresses, SignatureResponse, Utxo };
export type { SocialProfile } from 'yours-wallet-provider';

// Extended profile types
export interface WalletProfile {
  addresses?: Addresses;
  utxos?: Utxo[];
  balance?: number;
}

export interface ExtendedProfile extends BaseSocialProfile, WalletProfile {}

interface BroadcastParams {
  rawtx: string;
}

interface SendBsvParams {
  amount: number;
  address: string;
}

interface YoursContextType {
  connected: FetchStatus;
  pandaProfile: ExtendedProfile | null;
  isReady: boolean;
  getSocialProfile: () => Promise<BaseSocialProfile>;
  getAddresses: () => Promise<Addresses>;
  broadcast: (params: BroadcastParams) => Promise<string>;
  sendBsv: (params: SendBsvParams) => Promise<string>;
  utxos: Utxo[] | undefined;
  getSignatures: (params: {
    message: string;
    address: string;
  }) => Promise<SignatureResponse>;
}

const YoursContext = React.createContext<YoursContextType | undefined>(
  undefined,
);

interface UnspentTxOutput {
  value: number;
  tx_pos: number;
  tx_hash: string;
}

const getUtxos = async (
  fromAddress: string,
  _pullFresh: boolean,
): Promise<Utxo[]> => {
  try {
    const resp = await fetch(`${wocApiUrl}/address/${fromAddress}/unspent`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = (await resp.json()) as UnspentTxOutput[];
    const u = data
      .map((utxo: UnspentTxOutput) => {
        return {
          satoshis: utxo.value,
          vout: utxo.tx_pos,
          txid: utxo.tx_hash,
          script: new P2PKH().lock(fromAddress).toASM(),
        };
      })
      .sort((a: Utxo, b: Utxo) => (a.satoshis > b.satoshis ? -1 : 1));
    return u;
  } catch (_error) {
    return [];
  }
};

interface AutoYoursProviderProps {
  autoconnect?: boolean;
  children?: React.ReactNode;
}

const AutoYoursProvider: React.FC<AutoYoursProviderProps> = (props) => {
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
  const [pandaProfile, setPandaProfile] = useState<ExtendedProfile | null>(
    null,
  );
  const [connected, setConnected] = useState<FetchStatus>(FetchStatus.Loading);
  const [utxos, setUtxos] = useState<Utxo[] | undefined>(undefined);
  const dispatch = useDispatch();

  // Auto Authenticate when extension is available
  useEffect(() => {
    const fire = async () => {
      try {
        console.log('AutoYoursProvider: Checking connection status...');
        const c = await isConnected();
        console.log('AutoYoursProvider: Initial connection status:', c);

        if (!c && props.autoconnect) {
          console.log(
            'AutoYoursProvider: Not connected, attempting to connect...',
          );
          await connect();
          setConnected(FetchStatus.Success);
        } else if (c) {
          console.log(
            'AutoYoursProvider: Already connected, getting profile...',
          );
          setConnected(FetchStatus.Success);
          // If already connected, get profile and dispatch user info
          const profile = await getSocialProfile();
          console.log('AutoYoursProvider: Got profile:', profile);
          const addresses = await getAddresses();
          console.log('AutoYoursProvider: Got addresses:', addresses);
          if (profile?.paymail && addresses?.bsvAddress) {
            console.log('AutoYoursProvider: Dispatching user info:', {
              paymail: profile.paymail,
              address: addresses.bsvAddress,
            });
            dispatch(
              setYoursUser({
                paymail: profile.paymail,
                address: addresses.bsvAddress,
              }),
            );
          }
        } else {
          console.log(
            'AutoYoursProvider: Not connected and autoconnect disabled',
          );
          setConnected(FetchStatus.Error);
        }
      } catch (e) {
        console.error('AutoYoursProvider: Error in auto-authentication:', e);
        setConnected(FetchStatus.Error);
      }
    };
    if (isReady && connected === FetchStatus.Loading) {
      console.log(
        'AutoYoursProvider: Wallet ready, starting auto-authentication...',
      );
      fire();
    }
  }, [
    isConnected,
    isReady,
    connected,
    connect,
    props,
    getSocialProfile,
    getAddresses,
    dispatch,
  ]);

  useEffect(() => {
    const fire = async () => {
      if (!isReady) {
        console.log('AutoYoursProvider: Wallet not ready yet');
        return;
      }

      try {
        console.log('AutoYoursProvider: Getting addresses...');
        const addresses = await getAddresses();
        if (!addresses) {
          console.error('AutoYoursProvider: No addresses returned from wallet');
          return;
        }
        console.log('AutoYoursProvider: Got addresses:', addresses);

        console.log('AutoYoursProvider: Getting UTXOs...');
        const u = await getUtxos(addresses.bsvAddress, true);
        console.log('AutoYoursProvider: Got UTXOs:', u);
        setUtxos(u);

        console.log('AutoYoursProvider: Getting social profile...');
        const baseProfile = await getSocialProfile();
        if (!baseProfile) {
          console.error('AutoYoursProvider: No profile returned from wallet');
          return;
        }
        console.log('AutoYoursProvider: Got social profile:', baseProfile);

        const profile: ExtendedProfile = {
          ...baseProfile,
          addresses,
          utxos: u,
        };

        console.log('AutoYoursProvider: Getting balance...');
        const balance = await getBalance();
        if (balance) {
          profile.balance = balance.satoshis;
        }
        console.log('AutoYoursProvider: Got balance:', balance);

        setPandaProfile(profile);

        // Dispatch user info to session reducer
        if (profile.paymail && addresses.bsvAddress) {
          console.log('AutoYoursProvider: Dispatching user info:', {
            paymail: profile.paymail,
            address: addresses.bsvAddress,
          });
          dispatch(
            setYoursUser({
              paymail: profile.paymail,
              address: addresses.bsvAddress,
            }),
          );
        }
      } catch (error) {
        console.error('AutoYoursProvider: Error loading profile:', error);
      }
    };
    if (connected === FetchStatus.Success && !utxos && isReady) {
      console.log(
        'AutoYoursProvider: Connection successful, loading profile...',
      );
      fire();
    }
  }, [
    connected,
    getSocialProfile,
    setPandaProfile,
    getAddresses,
    utxos,
    getBalance,
    isReady,
    dispatch,
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
