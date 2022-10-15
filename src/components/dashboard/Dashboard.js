import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import Drawer from "@mui/material/Drawer";
import styled, { css } from "styled-components";

import { hideInDesktop } from "../../design/mixins";
import { useWindowWidth } from "../../hooks";
import { setActiveChannel } from "../../reducers/channelsReducer";
import { loadMessages } from "../../reducers/chatReducer";
import {
  setActiveUser,
  toggleMemberList,
} from "../../reducers/memberListReducer";
import { toggleSidebar } from "../../reducers/sidebarReducer";
import ChatArea from "./ChatArea";
import Header from "./Header";
import MemberList from "./MemberList";
import ImportIDModal from "./modals/ImportIDModal";
import Sidebar from "./Sidebar";

const Container = styled.div`
  display: grid;
  grid-template-columns: 312px 1fr;
  grid-template-rows: 48px 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar chat-area";

  ${(p) =>
    p.$isMemberListOpen &&
    css`
      grid-template-columns: 312px 1fr 240px;
      grid-template-areas:
        "sidebar header header"
        "sidebar chat-area member-list";
    `}

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "chat-area";
  }

  #sidebar {
    grid-area: sidebar;
  }

  #header {
    grid-area: header;
  }

  #chat-area {
    grid-area: chat-area;
  }

  #member-list {
    grid-area: member-list;
  }
`;

const MobileDrawer = styled(Drawer)`
  ${hideInDesktop}
`;

const DesktopItem = styled.div`
  display: ${(p) => (p.$isOpen ? "block" : "none")};

  @media (max-width: 768px) {
    display: none;
  }
`;

const ResponsiveSidebar = () => {
  const dispatch = useDispatch();
  const isSidebarOpen = useSelector((state) => state.sidebar.isOpen);

  return (
    <nav id="sidebar">
      <MobileDrawer
        anchor="left"
        variant="temporary"
        open={isSidebarOpen}
        onClose={() => dispatch(toggleSidebar())}
        ModalProps={{ keepMounted: true }}
      >
        <Sidebar />
      </MobileDrawer>
      <DesktopItem $isOpen>
        <Sidebar />
      </DesktopItem>
    </nav>
  );
};

const ResponsiveMemberList = () => {
  const dispatch = useDispatch();
  const isMemberListOpen = useSelector((state) => state.memberList.isOpen);
  const isInDesktop = useWindowWidth() > 768;

  return (
    <div id="member-list">
      <MobileDrawer
        anchor="right"
        variant="temporary"
        open={isMemberListOpen && !isInDesktop}
        onClose={() => dispatch(toggleMemberList())}
        ModalProps={{ keepMounted: true }}
      >
        <MemberList />
      </MobileDrawer>
      <DesktopItem $isOpen={isMemberListOpen && isInDesktop}>
        <MemberList />
      </DesktopItem>
    </div>
  );
};

const Dashboard = () => {
  const isMemberListOpen = useSelector((state) => state.memberList.isOpen);

  const params = useParams();
  const activeChannelId = params.channel;
  const activeUserId = params.user;
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setActiveChannel(activeChannelId));
    dispatch(setActiveUser(activeUserId));
    dispatch(
      loadMessages({ channelId: activeChannelId, userId: activeUserId })
    );
  }, [loadMessages, activeUserId, activeChannelId, dispatch]);

  return (
    <Container $isMemberListOpen={isMemberListOpen}>
      <ResponsiveSidebar />
      <Header />
      <ChatArea />
      <ResponsiveMemberList />
      <ImportIDModal />
    </Container>
  );
};

export default Dashboard;
