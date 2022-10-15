import nimble from "@runonbitcoin/nimble";
import bops from "bops";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { MAP_PREFIX } from "../../components/dashboard/WriteArea";
import { pinPaymentAddress } from "../../reducers/channelsReducer";
import { FetchStatus } from "../../utils/common";
import { useBap } from "../bap";
import { useBmap } from "../bmap";
import { useHandcash } from "../handcash";
import { useRelay } from "../relay";

const BitcoinContext = React.createContext(undefined);

const BitcoinProvider = (props) => {
  const { notifyIndexer } = useBmap();
  const { authToken, hcSignOpReturnWithAIP } = useHandcash();
  const { relayOne } = useRelay();
  const { identity } = useBap();
  const [pinStatus, setPinStatus] = useState(FetchStatus.Idle);

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

  const value = useMemo(
    () => ({
      sendPin,
      pinStatus,
    }),
    [sendPin, pinStatus]
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
