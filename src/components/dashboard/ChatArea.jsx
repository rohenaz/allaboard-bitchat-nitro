import React from 'react';
import tw, { styled } from 'twin.macro';
import Messages from './Messages';
import WriteArea from './WriteArea';

const Container = styled.div`
  ${tw`bg-background-primary flex flex-col w-full overflow-hidden`}
  height: calc(100dvh - 48px);
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
