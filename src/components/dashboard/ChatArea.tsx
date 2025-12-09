import type React from 'react';
import styled from 'styled-components';
import Messages from './Messages';
import WriteArea from './WriteArea';

const Container = styled.main`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background-color: var(--background);
  position: relative;
`;

const ChatArea: React.FC = () => {
	return (
		<Container>
			<Messages />
			<WriteArea />
		</Container>
	);
};

export default ChatArea;
