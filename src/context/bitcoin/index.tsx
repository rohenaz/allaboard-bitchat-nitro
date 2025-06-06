import { ECIES, Hash, type PrivateKey, type PublicKey, Script } from '@bsv/sdk';
import { HD, Utils } from '@bsv/sdk';
import bops from 'bops';
import { BAP } from 'bsv-bap';
import { head } from 'lodash';
import moment from 'moment';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Store } from 'redux';
import type { PendingFile } from '../../components/dashboard/WriteArea';
import { API_BASE_URL, HANDCASH_API_URL } from '../../config/env';
import { pinPaymentAddress } from '../../reducers/channelsReducer';
import {
  receiveNewMessage,
  receiveNewReaction,
} from '../../reducers/chatReducer';
import { FetchStatus } from '../../utils/common';
import { getSigningPathFromHex } from '../../utils/sign';
import { useBap } from '../bap';
import { useBmap } from '../bmap';
import { useHandcash } from '../handcash';
import { useYours } from '../yours';
const { toHex, toArray } = Utils;
// Add type definitions
interface DecIdentity {
  xprv: string;
  bapId?: string;
  ids?: { idKey: string }[];
}

interface SignerState {
  idKey: string;
  paymail: string;
  logo?: string;
  isFriend?: boolean;
}

interface Session {
  user: {
    bapId: string;
    idKey: string;
    walletType: string;
    paymail: string;
  };
  memberList?: {
    signers: {
      byId: Record<string, SignerState>;
    };
  };
}

interface MemberListState {
  byId: Record<
    string,
    {
      idKey: string;
      paymail: string;
      logo?: string;
      isFriend?: boolean;
    }
  >;
  friendRequests: {
    incoming: {
      byId: Record<
        string,
        {
          MAP: {
            publicKey: string;
            type: string;
          }[];
        }
      >;
    };
  };
}

interface RootState {
  session: Session;
  memberList: MemberListState;
}

// Add type for FetchStatus
type FetchStatusType = (typeof FetchStatus)[keyof typeof FetchStatus];

interface BitcoinContextValue {
  sendPin: (pm: string, channel: string, units: number) => Promise<void>;
  pinStatus: FetchStatusType;
  sendFriendRequest: (friendIdKey: string, xprv: string) => Promise<void>;
  friendRequestStatus: FetchStatusType;
  sendMessage: (
    pm: string,
    content: string,
    channel: string,
    userId: string,
    decIdentity: DecIdentity,
  ) => Promise<void>;
  postStatus: FetchStatusType;
  likeMessage: (
    pm: string,
    contextName: string,
    contextValue: string,
    emoji?: string,
  ) => Promise<void>;
  likeStatus: FetchStatusType;
  decryptStatus: FetchStatusType;
  signOpReturnWithAIP: (hexArray: string[]) => string[];
  signStatus: FetchStatusType;
  pendingFiles: PendingFile[];
  setPendingFiles: React.Dispatch<React.SetStateAction<PendingFile[]>>;
}

interface BitcoinProviderProps {
  children: React.ReactNode;
}

const BitcoinContext = React.createContext<BitcoinContextValue | undefined>(
  undefined,
);

const BitcoinProvider: React.FC<BitcoinProviderProps> = ({ children }) => {
  const { notifyIndexer } = useBmap();
  const { authToken } = useHandcash();
  const { pandaProfile, utxos, sendBsv } = useYours();
  const { decIdentity, decryptStatus } = useBap();
  const [pinStatus, setPinStatus] = useState<FetchStatusType>(FetchStatus.Idle);
  const [postStatus, setPostStatus] = useState<FetchStatusType>(
    FetchStatus.Idle,
  );
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [pendingFilesOutputs, setPendingFilesOutputs] = useState<string[][]>(
    [],
  );
  const [signStatus, setSignStatus] = useState<FetchStatusType>(
    FetchStatus.Idle,
  );
  const [likeStatus, setLikeStatus] = useState<FetchStatusType>(
    FetchStatus.Idle,
  );
  const [friendRequestStatus, setFriendRequestStatus] =
    useState<FetchStatusType>(FetchStatus.Idle);

  const dispatch = useDispatch();
  const params = useParams();
  const session = useSelector((state: RootState) => state.session);
  const isYoursWallet = session.user?.walletType === 'yours';

  const activeUserId = useMemo(() => params.user, [params.user]);
  const activeChannelId = useMemo(() => params.channel, [params.channel]);

  const signOpReturnWithAIP = useCallback(
    (hexArray: string[]): string[] => {
      setSignStatus(FetchStatus.Loading);

      if (!decIdentity) {
        setSignStatus(FetchStatus.Error);
        throw new Error('no auth token');
      }

      const idy = new BAP(decIdentity.xprv);
      if (decIdentity.ids) {
        idy.importIds(decIdentity.ids as { idKey: string }[], true);
      }

      const id = idy.getId(decIdentity.bapId as string);
      if (!id) {
        setSignStatus(FetchStatus.Error);
        throw new Error('no identity found');
      }

      const signedOps = id.signOpReturnWithAIP(hexArray);
      if (!signedOps) {
        setSignStatus(FetchStatus.Error);
        throw new Error('failed to sign');
      }

      setSignStatus(FetchStatus.Success);
      return signedOps;
    },
    [decIdentity],
  );

  const sendPin = useCallback(
    async (pm: string, channel: string, units: number) => {
      // TODO: Add panda support
      // in minutes
      // 0.001 BSV/10 minutes
      const pinPaymentAmount = 0.001 * units;
      setPinStatus(FetchStatus.Loading);
      try {
        const dataPayload = [
          MAP_PREFIX, // MAP Prefix
          'SET',
          'app',
          'bitchatnitro.com',
          'type',
          'pin_channel',
          'paymail',
          pm,
          'context',
          'channel',
          'channel',
          channel,
        ];

        const hexArray = dataPayload.map((d) =>
          Buffer.from(d, 'utf8').toString('hex'),
        );
        if (decIdentity) {
          // decrypt and import identity
          const signedOps = await signOpReturnWithAIP(hexArray);

          const resp = await fetch(`${HANDCASH_API_URL}/hcSend/`, {
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              to: pinPaymentAddress,
              amount: pinPaymentAmount,
              currency: 'BSV',
              hexArray: signedOps, // remove op_false op_return
              authToken,
              channel,
            }),
          });

          const { paymentResult } = await resp.json();
          setPinStatus(FetchStatus.Success);
          if (paymentResult?.rawTransactionHex) {
            try {
              await notifyIndexer(paymentResult.rawTransactionHex);
            } catch (_e) {
              setPinStatus(FetchStatus.Error);

              return;
            }
          }

          return;
        }

        // check for handcash token
        // let authToken = localStorage.getItem("bitchat-nitro.hc-auth-token");
        if (authToken) {
          const hexArray = dataPayload.map((str) =>
            bops.to(bops.from(str, 'utf8'), 'hex'),
          );
          // .join(" ")

          const resp = await fetch(`${HANDCASH_API_URL}/hcSend/`, {
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ hexArray, authToken, channel }),
          });

          const { paymentResult } = await resp.json();
          setPinStatus(FetchStatus.Success);

          await notifyIndexer(paymentResult.rawTransactionHex);
          return;
          // https://bitchatnitro.com/hcsend/
          // { hexArray, authToken}
        }
        // const script = nimble.Script.fromASM(
        //   "OP_0 OP_RETURN " +
        //     dataPayload
        //       .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
        //       .join(" ")
        // );
        // let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

        // if (pinPaymentAddress && units) {
        //   outputs.push({
        //     to: pinPaymentAddress,
        //     amount: pinPaymentAmount,
        //     currency: "BSV",
        //   });
        // }
        // let resp = await relayOne.send({ outputs });
        // setPinStatus(FetchStatus.Success);

        // console.log("Sent pin", resp);
        // interface SendResult {
        //   txid: string;
        //   rawTx: string;
        //   amount: number; // amount spent in button currency
        //   currency: string; // button currency
        //   satoshis: number; // amount spent in sats
        //   paymail: string; // user paymail deprecated
        //   identity: string; // user pki deprecated
        // }
        // try {
        //   await notifyIndexer(resp.rawTx);
        // } catch (e) {
        //   console.log("failed to notify indexer", e);
        //   return;
        // }
      } catch (e) {
        // Keep error log for production debugging
        console.error('Failed to send pin:', e);
        setPinStatus(FetchStatus.Error);
      }
    },
    [decIdentity, authToken, notifyIndexer, signOpReturnWithAIP],
  );

  const computedPendingFilesOutputs = useMemo(() => {
    return pendingFiles
      .map((f) => {
        const fileType = f.type;
        const fileSize = f.size;
        const fileName = f.name;

        return [
          'B',
          f.data,
          fileType,
          'binary',
          '|',
          'MAP',
          'SET',
          'app',
          'bitchatnitro.com',
          'type',
          'message',
          'filename',
          fileName,
          'filesize',
          fileSize.toString(),
        ];
      })
      .filter(Boolean);
  }, [pendingFiles]);

  useEffect(() => {
    setPendingFilesOutputs(computedPendingFilesOutputs);
  }, [computedPendingFilesOutputs]);

  // const _sendMessageWithRelay = useCallback(async (_signedDataOuts: string[][]) => {}, []);

  // const _sendMessageWithHandcash = useCallback(
  //   async (_signedDataOuts) => {},
  //   [],
  // );

  const handleMessage = useCallback(
    async (pm: string, content: string, channel: string, userId?: string) => {
      // Remove debug console.log
      setPostStatus(FetchStatus.Loading);

      try {
        const contentPayload = content
          ? [
              B_PREFIX, // B Prefix
              content,
              'text/plain',
              'utf-8',
            ]
          : [];

        const filesPayload = pendingFilesOutputs
          ? pendingFilesOutputs.flatMap((f, i) => (i === 0 ? f : ['|', ...f]))
          : [];

        const contentFilesSeparator =
          contentPayload.length > 0 && filesPayload.length > 0 ? ['|'] : [];

        const bPayload = [
          ...contentPayload,
          ...contentFilesSeparator,
          ...filesPayload,
        ];

        const dataPayload = [
          ...bPayload,
          '|',
          MAP_PREFIX, // MAP Prefix
          'SET',
          'app',
          'bitchatnitro.com',
          'type',
          'message',
        ];

        // DMs do not have a paymail field for privacy
        if (!userId) {
          dataPayload.push('paymail', pm);
        }

        // add channel
        if (channel) {
          dataPayload.push('context', 'channel', 'channel', channel);
        } else if (userId) {
          dataPayload.push(
            'encrypted',
            'true',
            'context',
            isYoursWallet ? 'paymail' : 'bapID',
            isYoursWallet ? 'paymail' : 'bapID',
            userId,
          );
        }

        // Remove debug console.log

        const hexArray = dataPayload.map((d) =>
          Buffer.from(d, 'utf8').toString('hex'),
        );

        // Send with Handcash
        if (authToken) {
          // Remove debug console.log
          let signedOps: string[] | undefined;
          if (decIdentity && !isYoursWallet) {
            // decrypt and import identity
            signedOps = await signOpReturnWithAIP(hexArray);
          }

          const resp = await fetch(`${HANDCASH_API_URL}/hcSend/`, {
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              hexArray: signedOps || hexArray,
              authToken,
              channel,
              userId,
            }),
          });

          const { paymentResult } = await resp.json();
          // Remove debug console.log

          // reset pending files
          if (pendingFiles) {
            setPendingFiles([]);
          }
          if (paymentResult?.rawTransactionHex) {
            try {
              const tx = await notifyIndexer(paymentResult.rawTransactionHex);
              tx.timestamp = moment().unix();
              dispatch(receiveNewMessage(tx));

              setPostStatus(FetchStatus.Success);
              return tx;
            } catch (error) {
              // Keep error log for production debugging
              console.error('Failed to notify indexer:', error);
              setPostStatus(FetchStatus.Error);
              throw error;
            }
          }
          return;
        }

        // Send with yours
        if (pandaProfile && utxos) {
          // Remove debug console.log
          let scriptP: Script;

          try {
            if (decIdentity && !isYoursWallet) {
              const signedOps = signOpReturnWithAIP(hexArray);
              scriptP = Script.fromASM(`OP_0 OP_RETURN ${signedOps.join(' ')}`);
            } else {
              scriptP = Script.fromASM(
                `OP_0 OP_RETURN ${dataPayload
                  .map((str) => bops.to(bops.from(str, 'utf8'), 'hex'))
                  .join(' ')}`,
              );
            }

            const resp = await sendBsv([
              {
                script: scriptP.toHex(),
                satoshis: 0,
              },
            ]);

            if (!resp) {
              setPostStatus(FetchStatus.Error);
              throw new Error('failed to send');
            }

            const { rawtx } = resp;

            const tx = await notifyIndexer(rawtx);
            tx.timestamp = moment().unix();
            dispatch(receiveNewMessage(tx));
            setPostStatus(FetchStatus.Success);
            return tx;
          } catch (error) {
            // Keep error log for production debugging
            console.error('Failed to send with Yours:', error);
            setPostStatus(FetchStatus.Error);
            throw error;
          }
        }

        // Keep error log for production debugging
        console.error('No valid sending method available');
        setPostStatus(FetchStatus.Error);
        throw new Error('No valid sending method available');
      } catch (error) {
        // Keep error log for production debugging
        console.error('Failed to send message:', error);
        setPostStatus(FetchStatus.Error);
        throw error;
      }
    },
    [
      authToken,
      notifyIndexer,
      dispatch,
      pandaProfile,
      utxos,
      sendBsv,
      pendingFiles,
      pendingFilesOutputs,
      signOpReturnWithAIP,
      isYoursWallet,
      decIdentity,
    ],
  );

  const likeMessage = useCallback(
    async (
      pm: string,
      contextName: string,
      contextValue: string,
      emoji?: string,
    ) => {
      try {
        const dataPayload = [
          MAP_PREFIX, // MAP Prefix
          'SET',
          'app',
          'bitchatnitro.com',
          'type',
          'like',
          'context',
          contextName,
          contextName,
          contextValue,
          'paymail',
          pm,
        ];

        // add channel
        if (emoji) {
          dataPayload.push('emoji', emoji);
        }

        // check for handcash token
        if (authToken) {
          const hexArray = dataPayload.map((str) =>
            bops.to(bops.from(str, 'utf8'), 'hex'),
          );
          // .join(" ")

          setLikeStatus(FetchStatus.Loading);

          const resp = await fetch(`${HANDCASH_API_URL}/hcSend/`, {
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              hexArray,
              authToken,
              channelId: activeChannelId,
            }),
          });
          const { paymentResult } = await resp.json();
          setLikeStatus(FetchStatus.Success);
          if (paymentResult) {
            const tx = await notifyIndexer(paymentResult.rawTransactionHex);
            dispatch(receiveNewReaction(tx));
          }

          return;
          // https://bitchatnitro.com/hcsend/
          // { hexArray, authToken}
        }
        // const script = nimble.Script.fromASM(
        //   "OP_0 OP_RETURN " +
        //     dataPayload
        //       .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
        //       .join(" ")
        // );
        // let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

        // let resp = await relayOne.send({ outputs });

        // console.log("Sent", resp);
        // setLikeStatus(FetchStatus.Success);

        // const tx = await notifyIndexer(resp.rawTx);
        // dispatch(receiveNewReaction(tx));
        // let txid = resp.txid;
      } catch (e) {
        // Keep error log for production debugging
        console.error('Failed to send like:', e);
        setLikeStatus(FetchStatus.Error);
      }
    },
    [dispatch, authToken, activeChannelId, notifyIndexer],
  );

  const self = useMemo(() => {
    return activeUserId && session.user?.bapId === activeUserId;
  }, [session, activeUserId]);

  const sendFriendRequest = useCallback(
    async (friendIdKey: string, xprv: string) => {
      if (!xprv) {
        // Keep error log for production debugging
        console.error('No xprv provided for friend request');
        return;
      }

      // Don't send friend request to yourself
      if (self) {
        return;
      }

      const publicFriendKey = friendPublicKeyFromSeedString(
        friendIdKey,
        xprv,
      ).toString();

      setFriendRequestStatus(FetchStatus.Loading);

      try {
        const dataPayload = [
          MAP_PREFIX, // MAP Prefix
          'SET',
          'app',
          'bitchatnitro.com',
          'type',
          'friend',
          'bapID',
          friendIdKey,
          'publicKey',
          publicFriendKey,
        ];

        const hexArray = dataPayload.map((str) =>
          Buffer.from(str, 'utf8').toString('hex'),
        );

        // Send with Handcash
        if (authToken && decIdentity && !isYoursWallet) {
          const signedOps = await signOpReturnWithAIP(hexArray);

          const resp = await fetch(`${HANDCASH_API_URL}/hcSend/`, {
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              hexArray: signedOps,
              authToken,
              userId: friendIdKey,
            }),
          });

          const { paymentResult } = await resp.json();

          if (paymentResult?.rawTransactionHex) {
            try {
              await notifyIndexer(paymentResult.rawTransactionHex);
              setFriendRequestStatus(FetchStatus.Success);
            } catch (error) {
              // Keep error log for production debugging
              console.error('Failed to notify indexer:', error);
              setFriendRequestStatus(FetchStatus.Error);
              throw error;
            }
          }
          return;
        }

        // Send with Yours wallet
        if (pandaProfile && utxos && sendBsv) {
          let scriptP: Script;

          if (decIdentity && !isYoursWallet) {
            const signedOps = await signOpReturnWithAIP(hexArray);
            scriptP = Script.fromASM(`OP_0 OP_RETURN ${signedOps.join(' ')}`);
          } else {
            scriptP = Script.fromASM(`OP_0 OP_RETURN ${hexArray.join(' ')}`);
          }

          const resp = await sendBsv([
            {
              script: scriptP.toHex(),
              satoshis: 0,
            },
          ]);

          if (!resp) {
            setFriendRequestStatus(FetchStatus.Error);
            throw new Error('Failed to send friend request');
          }

          const { rawtx } = resp;
          await notifyIndexer(rawtx);
          setFriendRequestStatus(FetchStatus.Success);
          return;
        }

        // If no wallet is connected
        // Keep error log for production debugging
        console.error('No wallet connected to send friend request');
        setFriendRequestStatus(FetchStatus.Error);
        // let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

        // let resp = await relayOne.send({ outputs });
        // setFriendRequestStatus(FetchStatus.Success);

        // console.log("Sent friend request", resp);
        // // interface SendResult {
        // //   txid: string;
        // //   rawTx: string;
        // //   amount: number; // amount spent in button currency
        // //   currency: string; // button currency
        // //   satoshis: number; // amount spent in sats
        // //   paymail: string; // user paymail deprecated
        // //   identity: string; // user pki deprecated
        // // }
        // try {
        //   await notifyIndexer(resp.rawTx);
        // } catch (e) {
        //   console.log("failed to notify indexer", e);
        //   return;
        // }
      } catch (e) {
        // Keep error log for production debugging
        console.error('Failed to send friend request:', e);
        setFriendRequestStatus(FetchStatus.Error);
      }
    },
    [
      self,
      decIdentity,
      authToken,
      notifyIndexer,
      signOpReturnWithAIP,
      isYoursWallet,
      pandaProfile,
      utxos,
      sendBsv,
    ],
  );

  const value = useMemo(
    () => ({
      sendPin,
      pinStatus,
      sendFriendRequest,
      friendRequestStatus,
      sendMessage: handleMessage,
      postStatus,
      likeMessage,
      likeStatus,
      decryptStatus,
      signOpReturnWithAIP,
      signStatus,
      pendingFiles,
      setPendingFiles,
    }),
    [
      sendPin,
      pinStatus,
      sendFriendRequest,
      friendRequestStatus,
      handleMessage,
      postStatus,
      likeMessage,
      likeStatus,
      decryptStatus,
      signOpReturnWithAIP,
      signStatus,
      pendingFiles,
    ],
  );

  return (
    <BitcoinContext.Provider value={value}>{children}</BitcoinContext.Provider>
  );
};

const useBitcoin = () => {
  const context = useContext(BitcoinContext);
  if (context === undefined) {
    throw new Error('useBitcoin must be used within an BitcoinProvider');
  }
  return context;
};

export { BitcoinProvider, useBitcoin };

//
// Utils
//

const B_PREFIX = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut';
const _AIP_PREFIX = '15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva';
export const MAP_PREFIX = '1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5';

export const decrypt = (
  data: string,
  privateKey: PrivateKey,
  publicKey: PublicKey,
) => {
  return publicKey
    ? ECIES.electrumDecrypt(toArray(data), privateKey, publicKey)
    : ECIES.electrumDecrypt(toArray(data), privateKey);
};

export const encrypt = (
  data: string,
  privateKey: PrivateKey,
  publicKey: PublicKey,
) => {
  return ECIES.electrumEncrypt(toArray(data), publicKey, privateKey);
};

export const friendPublicKeyFromSeedString = (
  seedString: string,
  xprv: string,
): PublicKey => {
  return friendPrivateKeyFromSeedString(seedString, xprv).toPublicKey();
};

export const friendPrivateKeyFromSeedString = (
  seedString: string,
  xprv: string,
): PrivateKey => {
  if (!xprv) {
    throw new Error('no xprv!');
  }
  // Generate a key based on the other users id hash
  const seedHex = toHex(Hash.sha256(toArray(seedString)));
  const signingPath = getSigningPathFromHex(seedHex);

  // Use @bsv/sdk HD class to derive the private key
  const hdKey = HD.fromString(xprv).derive(signingPath);
  return hdKey.privKey;
};
