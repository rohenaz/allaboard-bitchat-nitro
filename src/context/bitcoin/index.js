import nimble from "@runonbitcoin/nimble";
import bops from "bops";
import bsv from "bsv";
import { head } from "lodash";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useActiveChannel, useActiveUser } from "../../hooks";
import { pinPaymentAddress } from "../../reducers/channelsReducer";
import { FetchStatus } from "../../utils/common";
import { getSigningPathFromHex } from "../../utils/sign";
import { useBap } from "../bap";
import { useBmap } from "../bmap";
import { useHandcash } from "../handcash";
import { useRelay } from "../relay";
const { BAP } = require("bitcoin-bap");
const ECIES = require("bsv/ecies");
const BitcoinContext = React.createContext(undefined);

const BitcoinProvider = (props) => {
  const { notifyIndexer } = useBmap();
  const { authToken, hcSignOpReturnWithAIP, hcDecrypt } = useHandcash();
  const { relayOne } = useRelay();
  const { identity, decIdentity, decryptStatus } = useBap();
  const [pinStatus, setPinStatus] = useState(FetchStatus.Idle);
  const [postStatus, setPostStatus] = useState(FetchStatus.Idle);
  // TODO: Hook up like status
  const [likeStatus, setLikeStatus] = useState(FetchStatus.Idle);
  const activeUser = useActiveUser();
  const activeUserId = useSelector((state) => state.memberList.active);
  const activeChannel = useActiveChannel();
  const [friendRequestStatus, setFriendRequestStatus] = useState(
    FetchStatus.Idle
  );

  const encrypt = async (data, privateKey, publicKey) => {
    // decrypt identity
    return ECIES().privateKey(privateKey).publicKey(publicKey).encrypt(data);
  };

  const sendPin = useCallback(
    async (pm, channel, units) => {
      // in minutes
      // 0.001 BSV/10 minutes
      const pinPaymentAmount = 0.001 * units;
      setPinStatus(FetchStatus.Loading);
      try {
        let dataPayload = [
          MAP_PREFIX, // MAP Prefix
          "SET",
          "app",
          "bitchatnitro.com",
          "type",
          "pin_channel",
          "paymail",
          pm,
          "context",
          "channel",
          "channel",
          channel,
        ];

        const hexArray = dataPayload.map((d) =>
          Buffer.from(d, "utf8").toString("hex")
        );
        if (identity) {
          // decrypt and import identity
          const signedOps = await hcSignOpReturnWithAIP(identity, hexArray);

          const resp = await fetch(`https://bitchatnitro.com/hcsend/`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              to: pinPaymentAddress,
              amount: pinPaymentAmount,
              currency: "BSV",
              hexArray: signedOps, // remove op_false op_return
              authToken,
              channel,
            }),
          });

          const { paymentResult } = await resp.json();
          setPinStatus(FetchStatus.Success);

          console.log({ paymentResult });
          if (paymentResult?.rawTransactionHex) {
            try {
              await notifyIndexer(paymentResult.rawTransactionHex);
            } catch (e) {
              console.log("failed to notify indexer", e);
              setPinStatus(FetchStatus.Error);

              return;
            }
          }

          return;
        }

        // check for handcash token
        // let authToken = localStorage.getItem("bitchat-nitro.hc-auth-token");
        if (authToken) {
          let hexArray = dataPayload.map((str) =>
            bops.to(bops.from(str, "utf8"), "hex")
          );
          // .join(" ")

          const resp = await fetch(`https://bitchatnitro.com/hcsend/`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify({ hexArray, authToken, channel }),
          });

          const { paymentResult } = await resp.json();
          console.log({ paymentResult });
          setPinStatus(FetchStatus.Success);

          await notifyIndexer(paymentResult.rawTransactionHex);
          return;
          // https://bitchatnitro.com/hcsend/
          // { hexArray, authToken}
        }
        const script = nimble.Script.fromASM(
          "OP_0 OP_RETURN " +
            dataPayload
              .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
              .join(" ")
        );
        let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

        if (pinPaymentAddress && units) {
          outputs.push({
            to: pinPaymentAddress,
            amount: pinPaymentAmount,
            currency: "BSV",
          });
        }
        let resp = await relayOne.send({ outputs });
        setPinStatus(FetchStatus.Success);

        console.log("Sent", resp);
        // interface SendResult {
        //   txid: string;
        //   rawTx: string;
        //   amount: number; // amount spent in button currency
        //   currency: string; // button currency
        //   satoshis: number; // amount spent in sats
        //   paymail: string; // user paymail deprecated
        //   identity: string; // user pki deprecated
        // }
        try {
          await notifyIndexer(resp.rawTx);
        } catch (e) {
          console.log("failed to notify indexer", e);
          return;
        }
      } catch (e) {
        console.error(e);
        setPinStatus(FetchStatus.Error);
      }
    },
    [pinStatus, identity, relayOne, authToken, notifyIndexer]
  );

  const sendMessage = useCallback(
    async (pm, content, channel, userId) => {
      setPostStatus(FetchStatus.Loading);
      try {
        let dataPayload = [
          B_PREFIX, // B Prefix
          content,
          "text/plain",
          "utf-8",
          "|",
          MAP_PREFIX, // MAP Prefix
          "SET",
          "app",
          "bitchatnitro.com",
          "type",
          "message",
          "paymail",
          pm,
        ];

        // add channel
        if (channel) {
          dataPayload.push("context", "channel", "channel", channel);
        } else if (userId) {
          dataPayload.push(
            "encrypted",
            "true", // TODO: Set to true when encryption is working
            "context",
            "bapID",
            "bapID",
            userId
          );

          // const json = {
          //   context: "idKey",
          //   idKey: `<userID>`,
          //   subcontext: "protocol",
          //   protocol: "bap",
          // };

          const decIdentity = await hcDecrypt(identity);

          const hdPK = bsv.HDPrivateKey(decIdentity.xprv);

          const privateKey = hdPK.privateKey.toString();

          // Get did for user id
          // activeUser._id

          const payload = {
            idKey: activeUser._id,
          };

          let bapId = new BAP(decIdentity.xprv);
          console.log("BAP id", bapId);
          if (decIdentity.ids) {
            bapId.importIds(decIdentity.ids);
          }
          let bid = head(bapId.listIds());
          console.log({ bid });
          debugger;
          // const did = fetch(`https://bap-api.com/v1/identity/did`, {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify(payload),
          // });
          // Sample response
          //   {
          //     "status": "OK",
          //     "result": {
          //         "@context": [
          //             "https://w3id.org/did/v0.11",
          //             "https://w3id.org/bap/v1"
          //         ],
          //         "id": "did:bap:id:4VTFsUxuqtesi3WR5jQ2Py5Hok88",
          //         "publicKey": [
          //             {
          //                 "id": "did:bitcoin:tx:7d4200b09af45c5f6cb9fb610e7d5d6f80a9098809c7ebc0d0d8d0896cad6ca9#root",
          //                 "controller": "did:bap:id:4VTFsUxuqtesi3WR5jQ2Py5Hok88",
          //                 "type": "EcdsaSecp256k1VerificationKey2019",
          //                 "bitcoinAddress": "12nHp4QxRRpSn2uMdRQU1RL1hAbJxxnN3d"
          //             }
          //         ],
          //         "authentication": [
          //             "#root"
          //         ],
          //         "assertionMethod": [
          //             "#root"
          //         ]
          //     }
          // }
          // const didJson = await did.json();
          // const publicKey = didJson.result.publicKey;
          // console.log({
          //   decIdentity,
          //   hdPK,
          //   privateKey,
          //   didJson,
          // });
          //          const did = await getDid()
          // get public key for user id

          // encrypt the content with shared ecies between the two identities
          dataPayload[1] = encrypt(
            dataPayload[1],
            privateKey,
            activeUser.user.publicKey
          );
        }
        const hexArray = dataPayload.map((d) =>
          Buffer.from(d, "utf8").toString("hex")
        );
        if (identity) {
          // decrypt and import identity

          const signedOps = await hcSignOpReturnWithAIP(identity, hexArray);

          console.log({ signedOps });

          const resp = await fetch(`https://bitchatnitro.com/hcsend/`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              hexArray: signedOps, // remove op_false op_return
              authToken,
              channel,
              userId,
            }),
          });

          const { paymentResult } = await resp.json();

          console.log({ paymentResult });
          if (paymentResult?.rawTransactionHex) {
            try {
              await notifyIndexer(paymentResult.rawTransactionHex);
              setPostStatus(FetchStatus.Success);
            } catch (e) {
              console.log("failed to notify indexer", e);
              setPostStatus(FetchStatus.Error);

              return;
            }
          }
          return;
        }

        // check for handcash token
        // let authToken = localStorage.getItem("bitchat-nitro.hc-auth-token");
        if (authToken) {
          let hexArray = dataPayload.map((str) =>
            bops.to(bops.from(str, "utf8"), "hex")
          );
          // .join(" ")

          const resp = await fetch(`https://bitchatnitro.com/hcsend/`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify({ hexArray, authToken, channel }),
          });

          console.log({ resp });
          return;
          // https://bitchatnitro.com/hcsend/
          // { hexArray, authToken}
        }
        const script = nimble.Script.fromASM(
          "OP_0 OP_RETURN " +
            dataPayload
              .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
              .join(" ")
        );
        let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

        let resp = await relayOne.send({ outputs });
        console.log("Sent", resp);
        // interface SendResult {
        //   txid: string;
        //   rawTx: string;
        //   amount: number; // amount spent in button currency
        //   currency: string; // button currency
        //   satoshis: number; // amount spent in sats
        //   paymail: string; // user paymail deprecated
        //   identity: string; // user pki deprecated
        // }
        try {
          await notifyIndexer(resp.rawTx);
        } catch (e) {
          console.log("failed to notify indexer", e);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    },
    [activeUserId, identity, relayOne, authToken, notifyIndexer]
  );

  const likeMessage = useCallback(
    async (pm, contextName, contextValue, emoji) => {
      try {
        let dataPayload = [
          MAP_PREFIX, // MAP Prefix
          "SET",
          "app",
          "bitchatnitro.com",
          "type",
          "like",
          "context",
          contextName,
          contextName,
          contextValue,
          "paymail",
          pm,
        ];

        // add channel
        if (emoji) {
          dataPayload.push("emoji", emoji);
        }

        // check for handcash token
        if (authToken) {
          let hexArray = dataPayload.map((str) =>
            bops.to(bops.from(str, "utf8"), "hex")
          );
          // .join(" ")

          const resp = await fetch(`https://bitchatnitro.com/hcsend/`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify({ hexArray, authToken, activeChannel }),
          });
          const { paymentResult } = await resp.json();

          console.log({ paymentResult });
          if (paymentResult) {
            await notifyIndexer(paymentResult.rawTransactionHex);
          }

          return;
          // https://bitchatnitro.com/hcsend/
          // { hexArray, authToken}
        }
        const script = nimble.Script.fromASM(
          "OP_0 OP_RETURN " +
            dataPayload
              .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
              .join(" ")
        );
        let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

        let resp = await relayOne.send({ outputs });

        console.log("Sent", resp);

        await notifyIndexer(resp.rawTx);
        // let txid = resp.txid;
      } catch (e) {
        console.error(e);
      }
    },
    [authToken]
  );

  const sendFriendRequest = useCallback(
    async (friendIdKey, xprv) => {
      //       MAP
      // SET app <appame>
      // type friend
      // idKey <idKey> - their id key
      // publicKey <publicKey> - the public key i generated for this interaction

      // TODO: Generate a key based on the other users id hash
      const seedHex = bsv.crypto.Hash.sha256(Buffer.from(friendIdKey)).toString(
        "hex"
      );
      const signingPath = getSigningPathFromHex(seedHex);

      const hdPrivateFriendKey =
        bsv.HDPrivateKey.fromString(xprv).deriveChild(signingPath);

      const publicFriendKey = hdPrivateFriendKey.privateKey.publicKey;

      // hdPrivateFriendKey.PrivateKey.from activeUser.idKey);
      console.log({ publicFriendKey, seedHex, signingPath, friendIdKey });
      setFriendRequestStatus(FetchStatus.Loading);
      try {
        let dataPayload = [
          MAP_PREFIX, // MAP Prefix
          "SET",
          "app",
          "bitchatnitro.com",
          "type",
          "friend",
          "bapID",
          friendIdKey, // TODO: We don't have this until session provider resolves your ALIAS doc
          "publicKey",
          publicFriendKey.toString(),
        ];

        let hexArray = dataPayload.map((str) =>
          bops.to(bops.from(str, "utf8"), "hex")
        );
        if (identity) {
          console.log({ hexArray });
          // decrypt and import identity
          const signedOps = await hcSignOpReturnWithAIP(identity, hexArray);

          console.log({ signedOps });
          const resp = await fetch(`https://bitchatnitro.com/hcsend/`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              hexArray: signedOps, // remove op_false op_return
              authToken,
              userId: friendIdKey,
            }),
          });

          const { paymentResult } = await resp.json();
          setFriendRequestStatus(FetchStatus.Success);

          console.log({ paymentResult });
          if (paymentResult?.rawTransactionHex) {
            try {
              await notifyIndexer(paymentResult.rawTransactionHex);
            } catch (e) {
              console.log("failed to notify indexer", e);
              setFriendRequestStatus(FetchStatus.Error);

              return;
            }
          }

          return;
        }

        // check for handcash token
        // let authToken = localStorage.getItem("bitchat-nitro.hc-auth-token");
        if (authToken) {
          let hexArray = dataPayload.map((str) =>
            bops.to(bops.from(str, "utf8"), "hex")
          );
          // .join(" ")

          const resp = await fetch(`https://bitchatnitro.com/hcsend/`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify({ hexArray, authToken, userId: friendIdKey }),
          });

          const { paymentResult } = await resp.json();
          console.log({ paymentResult });
          setFriendRequestStatus(FetchStatus.Success);

          await notifyIndexer(paymentResult.rawTransactionHex);
          return;
          // https://bitchatnitro.com/hcsend/
          // { hexArray, authToken}
        }
        const script = nimble.Script.fromASM(
          "OP_0 OP_RETURN " +
            dataPayload
              .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
              .join(" ")
        );
        let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

        let resp = await relayOne.send({ outputs });
        setFriendRequestStatus(FetchStatus.Success);

        console.log("Sent", resp);
        // interface SendResult {
        //   txid: string;
        //   rawTx: string;
        //   amount: number; // amount spent in button currency
        //   currency: string; // button currency
        //   satoshis: number; // amount spent in sats
        //   paymail: string; // user paymail deprecated
        //   identity: string; // user pki deprecated
        // }
        try {
          await notifyIndexer(resp.rawTx);
        } catch (e) {
          console.log("failed to notify indexer", e);
          return;
        }
      } catch (e) {
        console.error(e);
        setFriendRequestStatus(FetchStatus.Error);
      }
    },
    [
      decIdentity,
      friendRequestStatus,
      identity,
      relayOne,
      authToken,
      notifyIndexer,
      hcDecrypt,
    ]
  );

  const value = useMemo(
    () => ({
      sendPin,
      pinStatus,
      sendFriendRequest,
      friendRequestStatus,
      sendMessage,
      postStatus,
      likeMessage,
      likeStatus,
    }),
    [
      sendFriendRequest,
      friendRequestStatus,
      sendPin,
      pinStatus,
      sendMessage,
      postStatus,
      likeMessage,
      likeStatus,
    ]
  );

  return (
    <>
      <BitcoinContext.Provider value={value} {...props} />
    </>
  );
};

const useBitcoin = () => {
  const context = useContext(BitcoinContext);
  if (context === undefined) {
    throw new Error("useBitcoin must be used within an BitcoinProvider");
  }
  return context;
};

export { BitcoinProvider, useBitcoin };

//
// Utils
//

const B_PREFIX = `19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut`;
const AIP_PREFIX = `15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva`;
export const MAP_PREFIX = `1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5`;
