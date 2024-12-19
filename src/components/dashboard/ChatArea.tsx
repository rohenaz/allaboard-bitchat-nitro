import type React from 'react';
import styled from 'styled-components';
import Messages from './Messages';
import WriteArea from './WriteArea';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  background-color: var(--background-primary);
  height: calc(100vh - 48px);
  overflow: hidden;
  position: relative;
`;

const MessagesWrapper = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  display: flex;
`;

const WriteAreaWrapper = styled.div`
  flex-shrink: 0;
  width: 100%;
  background-color: var(--background-primary);
  border-top: 1px solid var(--background-modifier-accent);
  padding: 0 16px 24px;
`;

const ChatArea: React.FC = () => {
  return (
    <Container>
      <MessagesWrapper>
        <Messages />
      </MessagesWrapper>
      <WriteAreaWrapper>
        <WriteArea />
      </WriteAreaWrapper>
    </Container>
  );
};

export default ChatArea;
