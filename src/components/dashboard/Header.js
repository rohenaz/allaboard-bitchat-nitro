import React from "react";

import { FaBars, FaGithub, FaSignOutAlt, FaUserFriends } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import { baseIcon, hideInDesktop, interactiveColor } from "../../design/mixins";
import { toggleMemberList } from "../../reducers/memberListReducer";
import { logout } from "../../reducers/sessionReducer";
import { toggleSidebar } from "../../reducers/sidebarReducer";
import ArrowTooltip from "./ArrowTooltip";
import Hashtag from "./Hashtag";
import List from "./List";

const Container = styled.div`
  background-color: var(--background-primary);
  border-bottom: 1px solid var(--background-tertiary);
  height: 48px;
  flex: 0 0 auto;
  padding: 0 16px;
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const Heading = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary);
`;

const IconWrapper = styled.button`
  ${baseIcon};
  ${interactiveColor};
  background-color: transparent;

  ${(p) => p.$isHamburger && hideInDesktop}
`;

const IconButton = ({ children, href, ...delegated }) => {
  const tag = href ? "a" : "button";
  const type = tag === "button" ? "button" : undefined;

  return (
    <IconWrapper
      as={tag}
      type={type}
      href={href}
      size="22px"
      w="24px"
      {...delegated}
    >
      {children}
    </IconWrapper>
  );
};

const Header = () => {
  const dispatch = useDispatch();
  const isMemberListOpen = useSelector((state) => state.memberList.isOpen);
  const channels = useSelector((state) => state.channels);
  const activeChannelId = useSelector((state) => state.channels.active);

  return (
    <Container id="header" className="disable-select">
      <List horizontal={true} gap="10px">
        <IconButton onClick={() => dispatch(toggleSidebar())} $isHamburger>
          <FaBars />
        </IconButton>
        <List horizontal={true} gap="6px" style={{ alignItems: "center" }}>
          {activeChannelId && <Hashtag size="22px" w="24px" />}
          <Heading>
            {!channels.loading && (activeChannelId || "global chat")}
          </Heading>
        </List>
      </List>
      <List horizontal={true} gap="16px">
        <ArrowTooltip title="GitHub Repo">
          <IconButton
            href="https://github.com/kingyiusuen/discord-clone"
            target="blank"
          >
            <FaGithub />
          </IconButton>
        </ArrowTooltip>
        <ArrowTooltip
          title={`${isMemberListOpen ? "Hide" : "Show"} Member list`}
        >
          <IconButton
            onClick={() => dispatch(toggleMemberList())}
            isActive={isMemberListOpen}
          >
            <FaUserFriends />
          </IconButton>
        </ArrowTooltip>
        <ArrowTooltip title="Logout">
          <IconButton onClick={() => dispatch(logout())}>
            <FaSignOutAlt />
          </IconButton>
        </ArrowTooltip>
      </List>
    </Container>
  );
};

export default Header;
