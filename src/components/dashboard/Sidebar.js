import React from "react";
import { useSelector } from "react-redux";

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
  const activeUserId = useSelector((state) => state.memberList.active);
  return (
    <Container>
      <ServerList />
      {!activeUserId && <ChannelList />}
      {activeUserId && <UserList />}
    </Container>
  );
};

export default Sidebar;
