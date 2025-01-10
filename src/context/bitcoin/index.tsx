import { ECIES, Hash, PrivateKey, PublicKey, Script } from '@bsv/sdk';
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
import { Utils, HD } from '@bsv/sdk';
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
  signOpReturnWithAIP: (hexArray: string[]) => Promise<string[]>;
  signStatus: FetchStatusType;
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

interface BitcoinProviderProps {
  children: React.ReactNode;
}

interface PendingFile {
  type: string;
  size: number;
  name: string;
  data: string;
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
  const storeAPI = useStore();
  const isYoursWallet = session.user?.walletType === 'yours';

  const activeUserId = useMemo(() => params.user, [params]);
  const activeChannelId = useMemo(() => params.channel, [params]);

  useEffect(() => {
    // Empty effect, can be removed if not needed
  }, []);

  const signOpReturnWithAIP = useCallback((hexArray: string[]) => {
    setSignStatus(FetchStatus.Loading);

    if (!decIdentity) {
      setSignStatus(FetchStatus.Error);
      throw new Error('no auth token');
    }

    const idy = new BAP(decIdentity.xprv);
    if (decIdentity.ids) {
      idy.importIds(decIdentity.ids as any, true);
    }

    const id = idy.getId(decIdentity.bapId as string);
    const signedOps = id?.signOpReturnWithAIP(hexArray);

    setSignStatus(FetchStatus.Success);
    return signedOps;
  }, [decIdentity]);

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
        console.error(e);
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
      console.log('handleMessage called with:', { pm, content, channel, userId });
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

        console.log('Constructed data payload:', dataPayload);

        const hexArray = dataPayload.map((d) =>
          Buffer.from(d, 'utf8').toString('hex'),
        );

        // Send with Handcash
        if (authToken) {
          console.log('Sending with Handcash');
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
          console.log('Handcash payment result:', paymentResult);

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
              console.error('Failed to notify indexer:', error);
              setPostStatus(FetchStatus.Error);
              throw error;
            }
          }
          return;
        }

        // Send with yours
        if (pandaProfile && utxos) {
          console.log('Sending with Yours');
          let scriptP;

          try {
            if (decIdentity && !isYoursWallet) {
              const signedOps = signOpReturnWithAIP(hexArray);
              scriptP = Script.fromASM(`OP_0 OP_RETURN ${signedOps?.join(' ')}`);
            } else {
              scriptP = Script.fromASM(
                `OP_0 OP_RETURN ${dataPayload
                  .map((str) => bops.to(bops.from(str, 'utf8'), 'hex'))
                  .join(' ')}`,
              );
            }
            const _outputsP = [
              { script: scriptP.toASM(), amount: 0, currency: 'BSV' },
            ];

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
            console.error('Failed to send with Yours:', error);
            setPostStatus(FetchStatus.Error);
            throw error;
          }
        }

        console.error('No valid sending method available');
        setPostStatus(FetchStatus.Error);
        throw new Error('No valid sending method available');
      } catch (error) {
        console.error('Failed to send message:', error);
        setPostStatus(FetchStatus.Error);
        throw error;
      }
    },
    [
      storeAPI,
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
      session.user?.paymail,
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
        console.error(e);
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
      if (decIdentity) {
        return;
      }
      //       MAP
      // SET app <appame>
      // type friend
      // idKey <idKey> - their id key
      // publicKey <publicKey> - the public key i generated for this interaction
      if (self) {
        return;
      }
      const publicFriendKey = friendPublicKeyFromSeedString(
        friendIdKey,
        xprv,
      ).toString();

      // hdPrivateFriendKey.PrivateKey.from activeUser.idKey);
      // console.log({ publicFriendKey, friendIdKey });
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
          friendIdKey, // TODO: We don't have this until session provider resolves your ALIAS doc
          'publicKey',
          publicFriendKey,
        ];

        const hexArray = dataPayload.map((str) =>
          bops.to(bops.from(str, 'utf8'), 'hex'),
        );
        if (authToken && decIdentity) {
          // console.log({ hexArray });
          // decrypt and import identity
          const signedOps = await signOpReturnWithAIP(hexArray);

          // console.log({ signedOps });
          const resp = await fetch(`${HANDCASH_API_URL}/hcSend/`, {
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              hexArray: signedOps, // remove op_false op_return
              authToken,
              userId: friendIdKey,
            }),
          });

          const { paymentResult } = await resp.json();
          setFriendRequestStatus(FetchStatus.Success);
          if (paymentResult?.rawTransactionHex) {
            try {
              await notifyIndexer(paymentResult.rawTransactionHex);
            } catch (_e) {
              setFriendRequestStatus(FetchStatus.Error);

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
            body: JSON.stringify({ hexArray, authToken, userId: friendIdKey }),
          });

          const { paymentResult } = await resp.json();
          setFriendRequestStatus(FetchStatus.Success);

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
        console.error(e);
        setFriendRequestStatus(FetchStatus.Error);
      }
    },
    [self, decIdentity, authToken, notifyIndexer, signOpReturnWithAIP],
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

export const decrypt = (data: string, privateKey: PrivateKey, publicKey: PublicKey) => {
  return publicKey
    ? ECIES.electrumDecrypt(toArray(data), privateKey, publicKey)
    : ECIES.electrumDecrypt(toArray(data), privateKey);
};

export const encrypt = (data: string, privateKey: PrivateKey, publicKey: PublicKey) => {
  if (publicKey) {
    return ECIES.electrumDecrypt(toArray(data), privateKey, publicKey);
  }
  return ECIES.electrumEncrypt(toArray(data), publicKey, privateKey);
};

export const friendPublicKeyFromSeedString = (seedString: string, xprv: string) => {
  return friendPrivateKeyFromSeedString(seedString, xprv).toPublic();
};

export const friendPrivateKeyFromSeedString = (seedString: string, xprv: string) => {
  if (!xprv) {
    throw new Error('no xprv!');
  }
  // Generate a key based on the other users id hash
  const seedHex = toHex(Hash.sha256(toArray(seedString)));
  const signingPath = getSigningPathFromHex(seedHex);

  // Note: Since @bsv/sdk doesn't have HD key support yet, we'll rely on bsv-bap's BAP class
  // to handle the HD key derivation. The BAP class should handle this internally.
  return HD.fromString(xprv).derive(signingPath);  
};

