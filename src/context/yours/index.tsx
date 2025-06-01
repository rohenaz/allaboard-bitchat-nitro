import { P2PKH } from '@bsv/sdk';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  type Addresses,
  type SocialProfile as BaseSocialProfile,
  type GetSignatures,
  type SendBsv,
  type SendBsvResponse,
  type SignatureResponse,
  type Utxo,
  useYoursWallet,
} from 'yours-wallet-provider';
import { setYoursUser } from '../../reducers/sessionReducer';
import { FetchStatus } from '../../utils/common';

const wocApiUrl = 'https://api.whatsonchain.com/v1/bsv/main';
const _profileStorageKey = 'nitro__YoursProvider_profile';

// Base types from yours-wallet-provider
export type { Addresses, SignatureResponse, Utxo };
export type { SocialProfile } from 'yours-wallet-provider';

// Extended profile types
export interface WalletProfile {
  addresses?: Addresses;
  utxos?: Utxo[];
  balance?: number;
}

// Extend BaseSocialProfile to include paymail
type ExtendedBaseSocialProfile = BaseSocialProfile & { paymail: string };

export interface ExtendedProfile
  extends ExtendedBaseSocialProfile,
    WalletProfile {}

interface BroadcastParams {
  rawtx: string;
}

interface YoursContextType {
  connected: FetchStatus;
  pandaProfile: ExtendedProfile | null;
  isReady: boolean;
  getSocialProfile: () => Promise<BaseSocialProfile | undefined>;
  getAddresses: () => Promise<Addresses | undefined>;
  broadcast: (params: BroadcastParams) => Promise<string | undefined>;
  sendBsv: (params: SendBsv[]) => Promise<SendBsvResponse | undefined>;
  utxos: Utxo[] | undefined;
  getSignatures: (
    params: GetSignatures,
  ) => Promise<SignatureResponse[] | undefined>;
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
        const c = await isConnected();

        if (!c && props.autoconnect) {
          // Not connected, attempting to connect...
          await connect();
          setConnected(FetchStatus.Success);
        } else if (c) {
          setConnected(FetchStatus.Success);
          // If already connected, get profile and dispatch user info
          const profile = await getSocialProfile();
          const addresses = await getAddresses();
          if (profile?.displayName && addresses?.bsvAddress) {
            const yoursPaymail = `${profile.displayName}@yours.org`;
            // Dispatch user info
            dispatch(
              setYoursUser({
                paymail: yoursPaymail,
                address: addresses.bsvAddress,
              }),
            );
          }
        } else {
          // Not connected and autoconnect disabled
          setConnected(FetchStatus.Error);
        }
      } catch (e) {
        // Keep error log for production debugging
        console.error('AutoYoursProvider: Error in auto-authentication:', e);
        setConnected(FetchStatus.Error);
      }
    };
    if (isReady && connected === FetchStatus.Loading) {
      // Wallet ready, starting auto-authentication...
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
        // Wallet not ready yet
        return;
      }

      try {
        const addresses = await getAddresses();
        if (!addresses) {
          // Keep error log for production debugging
          console.error('AutoYoursProvider: No addresses returned from wallet');
          return;
        }

        const u = await getUtxos(addresses.bsvAddress, true);
        setUtxos(u);

        const baseProfile = await getSocialProfile();
        if (!baseProfile) {
          // Keep error log for production debugging
          console.error('AutoYoursProvider: No profile returned from wallet');
          return;
        }

        const profile: ExtendedProfile = {
          ...baseProfile,
          addresses,
          utxos: u,
          paymail: `${baseProfile.displayName}@yours.org`,
        };

        const balance = await getBalance();
        if (balance) {
          profile.balance = balance.satoshis;
        }

        setPandaProfile(profile);

        // Dispatch user info to session reducer
        if (profile.paymail && addresses.bsvAddress) {
          // Dispatch user info
          dispatch(
            setYoursUser({
              paymail: profile.paymail,
              address: addresses.bsvAddress,
            }),
          );
        }
      } catch (error) {
        // Keep error log for production debugging
        console.error('AutoYoursProvider: Error loading profile:', error);
      }
    };
    if (connected === FetchStatus.Success && !utxos && isReady) {
      // Connection successful, loading profile...
      fire();
    }
  }, [
    connected,
    getSocialProfile,
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
