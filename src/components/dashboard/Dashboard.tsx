import type { FC } from 'react';
import styled from 'styled-components';
import ChannelList from './ChannelList';
import ChatArea from './ChatArea';
import Header from './Header';
import { MemberList } from './MemberList';
import ServerList from './ServerList';

interface DashboardProps {
  isFriendsPage: boolean;
}

const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--background-tertiary);
`;

const ServerColumn = styled.div`
  display: flex;
  flex-direction: column;
  width: 72px;
  min-width: 72px;
  background-color: var(--background-tertiary);
`;

const ChannelColumn = styled.div`
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;
  background-color: var(--background-secondary);
  overflow-y: auto;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background-color: var(--background-primary);
`;

export const Dashboard: FC<DashboardProps> = ({ isFriendsPage }) => {
  return (
    <Container>
      <ServerColumn>
        <ServerList />
      </ServerColumn>
      <ChannelColumn>
        <ChannelList />
      </ChannelColumn>
      <MainContent>
        <Header isFriendsPage={isFriendsPage} />
        <ChatArea />
      </MainContent>
      <MemberList />
    </Container>
  );
};
