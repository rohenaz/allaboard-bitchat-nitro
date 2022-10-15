import nimble from "@runonbitcoin/nimble";
import bops from "bops";
import { last } from "lodash";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useBap } from "../../context/bap";
import { useBmap } from "../../context/bmap";
import { useHandcash } from "../../context/handcash";
import { useRelay } from "../../context/relay";
import { useActiveChannel } from "../../hooks";
import { FetchStatus } from "../../utils/common";
import ChannelTextArea from "./ChannelTextArea";
import InvisibleSubmitButton from "./InvisibleSubmitButton";
// if (typeof Buffer === "undefined") {
//   /*global Buffer:writable*/
//   Buffer = require("buffer").Buffer;
// }

const Container = styled.div`
  background-color: var(--background-primary);
  height: 68px;
  padding: 0 16px;
  flex: 0 0 auto;
`;

const Form = styled.form``;

const TypingStatus = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--text-normal);
`;

const WriteArea = () => {
  const dispatch = useDispatch();
  // const user = useSelector((state) => state.session.user);
  const [postStatus, setPostStatus] = useState(FetchStatus.Idle);
  const { relayOne, paymail } = useRelay();
  const { profile, authToken, hcDecrypt, hcSignOpReturnWithAIP } =
    useHandcash();
  const { notifyIndexer } = useBmap();
  const { identity } = useBap();
  const activeChannel = useActiveChannel();
  const activeUserId = useSelector((state) => state.memberList.active);
  const channelName =
    activeChannel?.channel ||
    activeUserId ||
    last(window.location.pathname.split("/"));
  let timeout = undefined;

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const content = event.target.msg_content.value;

      if (content !== "" && (paymail || profile?.paymail)) {
        sendMessage(
          paymail || profile?.paymail,
          content,
          activeChannel?.channel,
          activeUserId
        );
        event.target.reset();
      }
    },
    [activeUserId, activeChannel, paymail, profile]
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
          dataPayload.push("context", "bapID", "bapID", userId);
          // encrypt the content with shared ecies between the two identities
          // dataPayload[1] = encrypt(dataPayload[1]);
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

  const typingUser = useSelector((state) => state.chat.typingUser);

  // TODO: Detect whether the user is typing
  const handleKeyDown = (event) => {
    let ctrlDown = false;
    let ctrlKey = 17;
    let cmdKey = 91;
    let vKey = 86;
    let cKey = 67;

    if (event.keyCode == ctrlKey || event.keyCode == cmdKey) ctrlDown = true;

    if (ctrlDown && event.keyCode == cKey) console.log("Document catch Ctrl+C");
    if (ctrlDown && event.keyCode == vKey) console.log("Document catch Ctrl+V");
  };

  const handleKeyUp = (event) => {
    const enterKey = 13;
    let ctrlDown = false;
    let ctrlKey = 17;
    let cmdKey = 91;
    let vKey = 86;
    let cKey = 67;

    if (event.keyCode == ctrlKey || event.keyCode == cmdKey) ctrlDown = false;

    if (event.keyCode === enterKey) {
      console.log("enter");
      // dispatch(stopTyping(paymail));
    } else if (event.keyCode === vKey && event.keycode === ctrlKey) {
      console.log("hey hey heeeyyyyy");
    } else {
      console.log("other");
      // dispatch(typing(paymail));
      // clearTimeout(timeout);
      // timeout = setTimeout(() => dispatch(stopTyping(paymail)), 2000);
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit} autocomplete="off">
        <ChannelTextArea
          type="text"
          name="msg_content"
          autocomplete="off"
          placeholder={
            postStatus === FetchStatus.Loading
              ? "Posting..."
              : `Message ${
                  activeChannel?.channel
                    ? "#" + activeChannel.channel
                    : activeUserId
                    ? "to @" + activeUserId
                    : "in global chat"
                }`
          }
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          onFocus={(e) => console.log(e.target)}
        />
        <InvisibleSubmitButton />
      </Form>
      <TypingStatus>
        {typingUser && `${typingUser.paymail} is typing...`}
      </TypingStatus>
    </Container>
  );
};

export default WriteArea;

const B_PREFIX = `19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut`;
const AIP_PREFIX = `15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva`;
export const MAP_PREFIX = `1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5`;

// /**
//  * Sign an op_return hex array with AIP
//  * @param opReturn {array}
//  * @param signingPath {string}
//  * @param outputType {string}
//  * @return {[]}
//  */
// const signOpReturnWithAIP = (
//   opReturn,
//   currentPath,
//   pk,
//   signingPath = "",
//   outputType = "hex"
// ) => {
//   const aipMessageBuffer = getAIPMessageBuffer(opReturn);

//   const { address, signature } = signMessage(
//     aipMessageBuffer,
//     currentPath,
//     pk,
//     signingPath
//   );

//   return opReturn.concat([
//     bops.to(bops.from("|", "utf8"), outputType),
//     bops.to(bops.from(AIP_PREFIX, "utf8"), outputType),
//     bops.to(bops.from("BITCOIN_ECDSA", "utf8"), outputType),
//     bops.to(bops.from(address, "utf8"), outputType),
//     bops.to(bops.from(signature, "base64"), outputType),
//   ]);
// };

// /**
//  * Construct an AIP buffer from the op return data
//  * @param opReturn
//  * @returns {Buffer}
//  */
// const getAIPMessageBuffer = (opReturn) => {
//   const buffers = [];
//   if (opReturn[0].replace("0x", "") !== "6a") {
//     // include OP_RETURN in constructing the signature buffer
//     buffers.push(bops.from("6a", "hex"));
//   }
//   opReturn.forEach((op) => {
//     buffers.push(bops.from(op.replace("0x", ""), "hex"));
//   });
//   // add a trailing "|" - this is the AIP way
//   buffers.push(bops.from("|"));

//   return bops.join([...buffers]);
// };

// /**
//  * Sign a message with the current signing address of this identity
//  *
//  * @param message
//  * @param signingPath
//  * @returns {{address, signature}}
//  */
// const signMessage = (message, currentPath, pk, signingPath = "") => {
//   // if (!(message instanceof Buffer)) {
//   //   message = bops.from(message, "");
//   // }

//   signingPath = signingPath || currentPath;
//   const derivedChild = pk.deriveChild(signingPath);
//   const address = derivedChild.privateKey.publicKey.toAddress().toString();

//   console.log({ address, derivedChild });
//   const bsvMsg = new bsv.Message(message);
//   console.log({ bsvMsg });
//   var hash = bsvMsg.magicHash();
//   // return ECDSA.signWithCalcI(hash, privateKey);
//   const signature = bsv.ECDSA.signWithCalcI(hash, derivedChild.privateKey);

//   // const signature = bsv.Message(message).sign(derivedChild.privateKey);

//   return { address, signature };
// };

// var sha256sha256 = bsv.crypto.Hash.sha256sha256;

// const magicHash = () => {
//   var prefix1 = bsv.util.BufferWriter.varintBufNum(
//     bsv.Message.MAGIC_BYTES.length
//   );
//   var prefix2 = bsv.util.BufferWriter.varintBufNum(
//     bsv.Message.messageBuffer.length
//   );
//   var buf = bops.join([
//     prefix1,
//     bsv.Message.MAGIC_BYTES,
//     prefix2,
//     bsv.Message.messageBuffer,
//   ]);
//   var hash = sha256sha256(buf);
//   return hash;
// };
