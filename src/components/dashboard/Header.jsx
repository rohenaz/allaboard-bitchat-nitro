import React, { useMemo } from "react";

import {
  FaBars,
  FaCog,
  FaGithub,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserFriends,
} from "react-icons/fa";
import { ImProfile } from "react-icons/im";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import tw from "twin.macro";
import { useHandcash } from "../../context/handcash";
import { hideInDesktop, interactiveColor } from "../../design/mixins";
import { useActiveUser } from "../../hooks";
import { toggleMemberList } from "../../reducers/memberListReducer";
import { toggleProfile } from "../../reducers/profileReducer";
import { logout } from "../../reducers/sessionReducer";
import { toggleSettings } from "../../reducers/settingsReducer";
import { toggleSidebar } from "../../reducers/sidebarReducer";
import ArrowTooltip from "./ArrowTooltip";
import At from "./At";
import Hashtag from "./Hashtag";
import { SettingsModal } from "./modals/SettingsModal";

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

const Heading = tw.div`
  font-semibold
  text-sm
  md:text-base
  whitespace-nowrap
  text-ellipsis
  text-white
`;

const IconWrapper = styled.button`
  ${tw`flex items-center content-center mr-2 md:mr-3`}
  ${interactiveColor};
  background-color: transparent;

  ${(p) => p.$isHamburger && hideInDesktop}
`;

const IconButton = ({ children, href, ...delegated }) => {
  const tag = href ? "a" : "button";
  const type = tag === "button" ? "button" : undefined;

  return (
    <IconWrapper as={tag} type={type} href={href} {...delegated}>
      {children}
    </IconWrapper>
  );
};

const Header = ({ isFriendsPage }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const isMemberListOpen = useSelector((state) => state.memberList.isOpen);
  const isProfileOpen = useSelector((state) => state.profile.isOpen);
  const channels = useSelector((state) => state.channels);
  const activeUser = useActiveUser();
  const navigate = useNavigate();
  const { authToken } = useHandcash();
  const activeChannelId = useMemo(() => {
    return params.channel;
  }, [params]);

  const activeUserId = useMemo(() => {
    return params.user;
  }, [params]);

  const guest = useMemo(() => {
    return !authToken && !activeUser;
  }, [authToken, activeUser]);

  return (
    <Container id="header" className="disable-select">
      <div className="flex flex-1">
        <div className="flex items-center justify-center">
          <IconButton onClick={() => dispatch(toggleSidebar())} $isHamburger>
            <FaBars className="mr-2" />
          </IconButton>
          <div className="flex items-center relative">
            <div className="mr-1">
              {activeChannelId && <Hashtag />}
              {activeUserId && <At />}
            </div>
            <Heading>
              {(isFriendsPage
                ? "Friends"
                : !channels?.loading && activeChannelId) ||
                activeUser?.user?.alternateName ||
                activeUserId ||
                "global chat"}
            </Heading>
          </div>
        </div>
      </div>
      <div className="flex flex-1 justify-end">
        <ArrowTooltip title="Settings">
          <IconButton onClick={() => dispatch(toggleSettings())}>
            <FaCog />
          </IconButton>
        </ArrowTooltip>
        <ArrowTooltip title="GitHub Repo">
          <IconButton
            href="https://github.com/rohenaz/allaboard-bitchat-nitro"
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
        <ArrowTooltip title={`${isProfileOpen ? "Hide" : "Show"} Profile`}>
          <IconButton
            onClick={() => dispatch(toggleProfile())}
            isActive={isProfileOpen}
          >
            <ImProfile />
          </IconButton>
        </ArrowTooltip>
        {!guest && (
          <ArrowTooltip title="Logout">
            <IconButton onClick={() => dispatch(logout())}>
              <FaSignOutAlt />
            </IconButton>
          </ArrowTooltip>
        )}
        {guest && (
          <ArrowTooltip title="Login">
            <IconButton onClick={() => navigate(`/login`)}>
              <FaSignInAlt />
            </IconButton>
          </ArrowTooltip>
        )}
      </div>
      <SettingsModal />
    </Container>
  );
};

export default Header;
