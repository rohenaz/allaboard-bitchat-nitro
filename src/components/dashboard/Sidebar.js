import React from "react";
import { useParams } from "react-router-dom";

import styled from "styled-components";

import ChannelList from "./ChannelList";
import ServerList from "./ServerList";
import UserList from "./UserList";

const Container = styled.div`
  display: flex;
  flex: 0 0 auto;
  height: 100vh;
`;

const Sidebar = () => {
  const params = useParams();
  const activeChannelId = params.channel;
  const activeUserId = params.user;

  return (
    <Container>
      <ServerList />
      {!activeUserId && <ChannelList activeChannelId={activeChannelId} />}
      {activeUserId && <UserList activeUserId={activeUserId} />}
    </Container>
  );
};

export default Sidebar;
