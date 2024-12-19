import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import ChannelList from './ChannelList';
import ServerList from './ServerList';
import UserList from './UserList';

const Container = styled.div`
  display: flex;
  flex: 0 0 auto;
  height: 100vh;
  background-color: var(--background-tertiary);
`;

const ServerListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 72px;
  background-color: var(--background-tertiary);
  padding: 12px 0;
`;

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 240px;
  background-color: var(--background-secondary);
`;

const Sidebar = () => {
  const params = useParams();
  const activeUserId = useMemo(() => params.user, [params]);

  return (
    <Container>
      <ServerListWrapper>
        <ServerList />
      </ServerListWrapper>
      <ListWrapper>
        {!activeUserId && <ChannelList />}
        {activeUserId && <UserList activeUserId={activeUserId} />}
      </ListWrapper>
    </Container>
  );
};

export default Sidebar;
