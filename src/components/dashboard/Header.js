import React, { useEffect } from "react";

import { FaBars, FaGithub, FaSignOutAlt } from "react-icons/fa";
import { ImProfile } from "react-icons/im";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import { baseIcon, hideInDesktop, interactiveColor } from "../../design/mixins";
import { useActiveUser } from "../../hooks";
import { toggleProfile } from "../../reducers/profileReducer";
import { logout } from "../../reducers/sessionReducer";
import { toggleSidebar } from "../../reducers/sidebarReducer";
import ArrowTooltip from "./ArrowTooltip";
import At from "./At";
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
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
  const isProfileOpen = useSelector((state) => state.profile.isOpen);
  const channels = useSelector((state) => state.channels);
  const activeChannelId = useSelector((state) => state.channels.active);
  const activeUserId = useSelector((state) => state.memberList.active);
  const activeUser = useActiveUser();

  useEffect(() => {
    console.log({ activeUserId });
  }, [activeUserId]);

  return (
    <Container id="header" className="disable-select">
      <List horizontal={true} gap="10px">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconButton onClick={() => dispatch(toggleSidebar())} $isHamburger>
            <FaBars />
          </IconButton>
          <List horizontal={true} gap="6px" style={{ alignItems: "center" }}>
            {activeChannelId && <Hashtag size={`22px`} w={`22px`} />}
            {activeUserId && <At size={`22px`} w={`22px`} h={`22px`} />}
            <Heading>
              {!channels.loading &&
                (activeChannelId ||
                  `${activeUser?.user?.alternateName || activeUserId}` ||
                  "global chat")}
            </Heading>
          </List>
        </div>
      </List>
      <List horizontal={true} gap="16px">
        <ArrowTooltip title="GitHub Repo">
          <IconButton
            href="https://github.com/rohenaz/allaboard-bitchat-nitro"
            target="blank"
          >
            <FaGithub />
          </IconButton>
        </ArrowTooltip>
        {/* <ArrowTooltip
          title={`${isMemberListOpen ? "Hide" : "Show"} Member list`}
        >
          <IconButton
            onClick={() => dispatch(toggleMemberList())}
            isActive={isMemberListOpen}
          >
            <FaUserFriends />
          </IconButton>
        </ArrowTooltip> */}
        <ArrowTooltip title={`${isProfileOpen ? "Hide" : "Show"} Profile`}>
          <IconButton
            onClick={() => dispatch(toggleProfile())}
            isActive={isProfileOpen}
          >
            <ImProfile />
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
