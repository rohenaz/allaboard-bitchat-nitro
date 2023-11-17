import React from "react";

import styled from "styled-components";

import Messages from "./Messages";
import WriteArea from "./WriteArea";

const Container = styled.div`
  background-color: white;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 96px);
  overflow: hidden;
`;

const ChatArea = () => {
  return (
    <Container id="chat-area">
      <Messages />
      <WriteArea />
    </Container>
  );
};

export default ChatArea;
