import React, { useCallback } from "react";

import nimble from "@runonbitcoin/nimble";
import bops from "bops";
import { last } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
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
  const { profile, authToken } = useHandcash();

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
    [relayOne, authToken]
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
export const MAP_PREFIX = `1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5`;
