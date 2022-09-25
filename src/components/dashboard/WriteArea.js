import React from "react";

import nimble from "@runonbitcoin/nimble";
import bops from "bops";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useRelay } from "../../context/relay";
import { useActiveChannel } from "../../hooks";
import { stopTyping, typing } from "../../reducers/chatReducer";
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

  const activeChannel = useActiveChannel();

  let timeout = undefined;
  const handleSubmit = (event) => {
    event.preventDefault();
    const content = event.target.content.value;
    if (content !== "") {
      sendMessage(paymail, content, activeChannel?.channel || null);
      event.target.reset();
    }
  };

  const sendMessage = async (paymail, content, channelId) => {
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
        "bitchat",
        "type",
        "message",
        "paymail",
        paymail,
      ];
      if (channelId) {
        dataPayload.push("context", "channel", "channel", channelId);
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
  };

  const typingUser = useSelector((state) => state.chat.typingUser);

  // Detect whether the user is typing
  const handleKeyUp = (event) => {
    const enterKey = 13;
    if (event.keyCode === enterKey) {
      dispatch(stopTyping(paymail));
    } else {
      dispatch(typing(paymail));
      clearTimeout(timeout);
      timeout = setTimeout(() => dispatch(stopTyping(paymail)), 2000);
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <ChannelTextArea
          type="text"
          name="content"
          placeholder={`Message ${
            activeChannel?.channel
              ? "#" + activeChannel.channel
              : "in global chat"
          }`}
          onKeyUp={handleKeyUp}
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
const MAP_PREFIX = `1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5`;
