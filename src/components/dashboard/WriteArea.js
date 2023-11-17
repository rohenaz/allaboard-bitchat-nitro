import { last } from "lodash";
import moment from "moment";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { HiPlusCircle } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { useBap } from "../../context/bap";
import { useBitcoin } from "../../context/bitcoin";
import { useHandcash } from "../../context/handcash";
import { usePanda } from "../../context/panda";
import { useRelay } from "../../context/relay";
import { useActiveUser } from "../../hooks";
import {
  receiveNewMessage,
  toggleFileUpload,
} from "../../reducers/chatReducer";
import { FetchStatus } from "../../utils/common";
import ChannelTextArea from "./ChannelTextArea";
import InvisibleSubmitButton from "./InvisibleSubmitButton";
import PlusModal from "./modals/PlusModal";

// if (typeof Buffer === "undefined") {
//   /*global Buffer:writable*/
//   Buffer = require("buffer").Buffer;
// }

const Container = styled.div`
  background-color: var(--background-primary);
  height: 48px;
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
  // const user = useSelector((state) => state.session.user);
  const { paymail, ready } = useRelay();
  const { authToken, decryptStatus, profile, signStatus } = useHandcash();
  const { connected, pandaProfile } = usePanda();
  const { sendMessage, postStatus, pendingFiles, setPendingFiles } =
    useBitcoin();
  const params = useParams();

  const [searchParams, setSearchParams] = useSearchParams();
  const [showPlusPopover, setShowPlusPopover] = useState(false);

  const { decIdentity } = useBap();
  const activeUser = useActiveUser();

  const friendRequests = useSelector(
    (state) => state.memberList.friendRequests
  );
  const loadingMembers = useSelector((state) => state.memberList.loading);
  const loadingPins = useSelector((state) => state.channels.pins.loading);
  const loadingChannels = useSelector((state) => state.channels.loading);
  const loadingMessages = useSelector((state) => state.chat.messages.loading);
  const loadingFriendRequests = useSelector(
    (state) => state.memberList.friendRequests.loading
  );
  const dispatch = useDispatch();
  const session = useSelector((state) => state.session);
  const inputRef = useRef(null);

  const activeChannelId = useMemo(() => {
    return params.channel;
  }, [params]);

  const activeUserId = useMemo(() => {
    return params.user;
  }, [params]);

  const pendingMessage = useMemo(() => {
    return searchParams.get("m");
  }, [params]);

  const [messageContent, setMessageContent] = useState(
    pendingMessage || undefined
  );

  const channelName =
    activeChannelId ||
    activeUserId ||
    last(window?.location?.pathname?.split("/"));

  const changeContent = useCallback(
    (e) => {
      setMessageContent(e.target.value);
    },
    [messageContent]
  );

  const guest = useMemo(() => {
    return !authToken && !paymail && !pandaProfile;
  }, [authToken, paymail, pandaProfile]);

  const togglePlusPopover = useCallback(() => {
    setShowPlusPopover(!showPlusPopover);
  }, [showPlusPopover]);

  const handleSubmit = useCallback(
    async (event) => {
      if (!authToken && !ready && !connected) {
        // TODO: Create
        console.log(
          "Cannot post. Relay not loaded and no Handcash auth and no panda connection"
        );
        return;
      }

      event.preventDefault();
      const content = event.target.msg_content.value;
      setMessageContent("");
      if (content !== "" && (paymail || profile?.paymail || pandaProfile)) {
        event.target.reset();
        try {
          await sendMessage(
            paymail || profile?.paymail || pandaProfile?.displayName,
            content,
            activeChannelId,
            activeUserId,
            decIdentity
          );
        } catch (e) {
          console.log("dispatch error message", e);
          dispatch(
            receiveNewMessage({
              B: { content: "Error: Failed to send" },
              MAP: {
                app: "bitchatnitro.com",
                type: "message",
                paymail: "system@bitchatnitro.com",
              },
              timestamp: moment().unix(),
              blk: { t: moment().unix() },
              tx: { h: "error" },
              _id: "error",
            })
          );
        }
      }
    },
    [
      decIdentity,
      activeUserId,
      activeChannelId,
      paymail,
      profile,
      authToken,
      ready,
      messageContent,
      sendMessage,
      connected,
    ]
  );

  // const enablePublicComms = useCallback(async () => {
  //   try {
  //     const decIdentity = await hcDecrypt(identity);

  //     const hdPK = bsv.HDPrivateKey.fromString(decIdentity.xprv);

  //     const privateKey = hdPK.privateKey.toString();

  //     // only add the attribute if its needed
  //     if (!decIdentity.commsPublicKey) {
  //       const hexString = `<TODO: hash of user's id key>`;
  //       const signingPath = getSigningPathFromHex(hexString, true);

  //       // TODO: Add the commsPublicKey attribute to ALIAS doc

  //       // newId.addAttribute(
  //       //   "commsPublicKey",
  //       //   privateKey.deriveChild(signingPath).publicKey.toString()
  //       // );
  //       // newId.addAttribute("email", "john@doe.com");
  //     }
  //   } catch (e) {
  //     throw e;
  //   }
  // }, [identity, hcDecrypt]);

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
      // console.log("other");
      // dispatch(typing(paymail));
      // clearTimeout(timeout);
      // timeout = setTimeout(() => dispatch(stopTyping(paymail)), 2000);
    }
  };

  // TODO: When loading the page show what is loading in the placeholder

  const self = useMemo(() => {
    return activeUser && session.user?.bapId === activeUser?._id;
  }, [session, activeUser]);

  console.log({activeUser})
  return (
    <Container>
      <Form onSubmit={handleSubmit} autocomplete="off" className="relative">
        {pendingFiles.length > 0 && (
          <div className="flex items-center absolute -mt-10 bg-[#222] w-full rounded p-2">
            <span className="font-semibold mr-2">Attachments:</span>
            {pendingFiles.map((f, idx) => (
              <div className="mr-2 flex items-center truncate" key={f.name}>
                <div className="min-w-0 truncate">{f.name}</div>
                {idx < pendingFiles.length - 1 ? "," : ""}
              </div>
            ))}
            {pendingFiles.length > 0 && (
              <div
                className="cursor-pointer p-1 hover:text-red-400"
                onClick={() => setPendingFiles([])}
              >
                <IoMdClose className="" size={16} />
              </div>
            )}
          </div>
        )}
        {/* Images opnly enabled for relay users */}
        {paymail && (
          <div
            className="flex items-center justify-center absolute left-0 h-full w-12"
            onClick={(e) => {
              if (
                signStatus === FetchStatus.Loading ||
                postStatus === FetchStatus.Loading
              ) {
                return;
              }
              dispatch(toggleFileUpload());
            }}
          >
            <HiPlusCircle className="text-2xl ml-2 text-[#aaa]" />
          </div>
        )}
        <ChannelTextArea
          type="text"
          id="channelTextArea"
          name="msg_content"
          autocomplete="off"
          className={paymail ? `pl-12` : `pl-4`}
          placeholder={
            !activeUser?.idKey && activeUser
              ? `DMs Disabled`
              : activeUser && loadingMembers
              ? `Loading members...`
              : !activeUser && loadingPins
              ? `Loading pinned channels...`
              : !activeUser && loadingChannels
              ? `Loading channels...`
              : activeUser && loadingFriendRequests
              ? `Loading friends`
              : loadingMessages
              ? `Loading messages...`
              : decryptStatus === FetchStatus.Loading
              ? `Decrypting...`
              : signStatus === FetchStatus.Loading
              ? `Signing...`
              : postStatus === FetchStatus.Loading
              ? "Posting..."
              : `Message ${
                  activeChannelId
                    ? "#" + activeChannelId
                    : activeUserId
                    ? "to @" + activeUserId
                    : "in global chat"
                }`
          }
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
          onFocus={(e) => console.log(e.target)}
          value={messageContent}
          onChange={changeContent}
          ref={inputRef}
          disabled={
            guest ||
            (!self &&
              activeUser &&
              !(
                friendRequests.incoming.allIds.includes(activeUser?._id) &&
                friendRequests.outgoing.allIds.includes(activeUser?._id)
              ) &&
              !decIdentity?.result?.commsPublicKey)
          }
        />
        <InvisibleSubmitButton />
      </Form>
      <TypingStatus>
        {typingUser && `${typingUser.paymail} is typing...`}
      </TypingStatus>
      <PlusModal open={showPlusPopover} onClose={inputRef.current?.focus()} />
    </Container>
  );
};

export default WriteArea;

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
