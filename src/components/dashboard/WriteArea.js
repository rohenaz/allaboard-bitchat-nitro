import React, { useCallback } from "react";

import nimble from "@runonbitcoin/nimble";
import { BAP } from "bitcoin-bap";
import bops from "bops";
import bsv from "bsv";
import Buffer from "Buffer";
import { last } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useBap } from "../../context/bap";
import { useHandcash } from "../../context/handcash";
import { useRelay } from "../../context/relay";
import { useActiveChannel } from "../../hooks";
import ChannelTextArea from "./ChannelTextArea";
import InvisibleSubmitButton from "./InvisibleSubmitButton";

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
  const { relayOne, paymail } = useRelay();
  const { profile, authToken, hcDecrypt } = useHandcash();
  const { identity } = useBap();

  const activeChannel = useActiveChannel();
  const channelId = last(window.location.pathname.split("/"));
  let timeout = undefined;

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const content = event.target.msg_content.value;

      if (content !== "" && (paymail || profile?.paymail)) {
        sendMessage(
          paymail || profile?.paymail,
          content,
          activeChannel?.channel || channelId || null
        );
        event.target.reset();
      }
    },
    [activeChannel, paymail, profile]
  );

  const sendMessage = useCallback(
    async (pm, content, channel) => {
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
        }

        if (identity) {
          // decrypt and import identity
          const decIdentity = await hcDecrypt(identity);
          console.log("sign with", decIdentity);

          console.log({ BAP });

          let bapId = new BAP(decIdentity.xprv);
          console.log("BAP id", bapId);
          if (decIdentity.ids) {
            bapId.importIds(decIdentity.ids);
          }

          const ids = bapId.listIds();
          console.log({ ids });
          const idy = bapId.getId(ids[0]); // only support for 1 id per profile now
          console.log({
            idy: idy.signOpReturnWithAIP,
            getAipBuf: idy.getAIPMessageBuffer,
          });
          const ops = dataPayload.map((d) => Buffer.to(Buffer.from(d), "hex"));

          // const aipBuff = idy.getAIPMessageBuffer();
          // console.log({ aipBuff, apiString: aipBuff.toString("utf8") });

          console.log({ ops, Buffer });
          const signedOps = idy.signOpReturnWithAIP(
            ops,
            idy.currentPath,
            bsv.HDPrivateKey.fromString(decIdentity.xprv)
          );

          // sign the payload
          // derive a child for signing?
          // let hdk = bsv.HDPrivateKey.fromString(decIdentity.xprv);
          // const child = hdk.deriveChild("m/0/0");
          // const aipSignAddress = bsv.Address.fromPrivateKey(child.privateKey);
          // dataPayload.push(AIP_PREFIX, "BITCOIN_ECDSA", aipSignAddress);

          console.log({ signedOps });

          const resp = await fetch(`https://bitchatnitro.com/hcsend/`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              hexArray: signedOps, // remove op_false op_return
              authToken,
              channel,
            }),
          });

          console.log({ resp });

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
        let txid = resp.txid;
      } catch (e) {
        console.error(e);
      }
    },
    [identity, relayOne, authToken]
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
          placeholder={`Message ${
            activeChannel?.channel
              ? "#" + activeChannel.channel
              : "in global chat"
          }`}
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
