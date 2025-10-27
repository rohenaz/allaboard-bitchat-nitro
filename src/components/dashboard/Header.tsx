import type { ReactElement } from 'react';
import { useMemo } from 'react';
import {
  FaBars,
  FaCog,
  FaGithub,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserFriends,
} from 'react-icons/fa';
import { ImProfile } from 'react-icons/im';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { hideInDesktop } from '../../design/mixins';
import { useActiveUser } from '../../hooks';
import { toggleMemberList } from '../../reducers/memberListReducer';
import { logout } from '../../reducers/sessionReducer';
import { toggleSettings } from '../../reducers/settingsReducer';
import { toggleSidebar } from '../../reducers/sidebarReducer';
import type { RootState } from '../../store';
import ArrowTooltip from './ArrowTooltip';
import { UserSearch } from './UserSearch';
import { SettingsModal } from './modals/SettingsModal';

const Container = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  min-height: 48px;
  background-color: var(--background-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0 16px;
  position: relative;
  z-index: 1;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
`;

const MiddleSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  max-width: 400px;
  padding: 0 16px;
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

const ChannelName = styled.h1`
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--text-normal);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface IconButtonProps {
  $isActive?: boolean;
  $isHamburger?: boolean;
}

const IconButton = styled.button<IconButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: ${({ $isActive }) => ($isActive ? 'var(--interactive-active)' : 'var(--interactive-normal)')};
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease-out;
  font-size: 20px;

  &:hover {
    color: var(--interactive-hover);
    background-color: var(--background-modifier-hover);
  }

  ${({ $isHamburger }) => $isHamburger && hideInDesktop};

  svg {
    width: 20px;
    height: 20px;
  }
`;

const HamburgerButton = styled(IconButton)`
  margin-right: 16px;
  
  @media (min-width: 768px) {
    display: none;
  }
`;

const HashtagIcon = styled.span`
  color: var(--channels-default);
  font-size: 24px;
  font-weight: 600;
  margin-right: 8px;
  &::before {
    content: '#';
  }
`;

const AtIcon = styled.span`
  color: var(--channels-default);
  font-size: 24px;
  font-weight: 600;
  margin-right: 8px;
  &::before {
    content: '@';
  }
`;

interface HeaderProps {
  isFriendsPage?: boolean;
}

const Header = ({ isFriendsPage = false }: HeaderProps): ReactElement => {
  const dispatch = useDispatch();
  const params = useParams<{ channel?: string; user?: string }>();
  const isMemberListOpen = useSelector(
    (state: RootState) => state.memberList.isOpen,
  );
  const channels = useSelector((state: RootState) => state.channels);
  const activeUser = useActiveUser();
  const navigate = useNavigate();
  const { authToken, profile } = useHandcash();

  const activeChannelId = useMemo(() => params.channel, [params]);
  const activeUserId = useMemo(() => params.user, [params]);
  const guest = useMemo(
    () => !authToken && !activeUser,
    [authToken, activeUser],
  );

  const channelName = useMemo(() => {
    if (isFriendsPage) return 'Friends';
    if (!channels?.loading && activeChannelId) return activeChannelId;
    if (profile?.paymail) return profile.paymail;
    if (activeUser?.paymail) return activeUser.paymail;
    if (activeUserId) return activeUserId;
    return 'general';
  }, [
    isFriendsPage,
    channels?.loading,
    activeChannelId,
    profile?.paymail,
    activeUser?.paymail,
    activeUserId,
  ]);

  return (
    <Container>
      <LeftSection>
        <HamburgerButton onClick={() => dispatch(toggleSidebar())}>
          <FaBars />
        </HamburgerButton>

        <ChannelInfo>
          {activeChannelId && <HashtagIcon />}
          {activeUserId && <AtIcon />}
          <ChannelName>{channelName}</ChannelName>
        </ChannelInfo>
      </LeftSection>

      <MiddleSection>{isFriendsPage && <UserSearch />}</MiddleSection>

      <ActionButtons>
        <ArrowTooltip title="Settings">
          <IconButton onClick={() => dispatch(toggleSettings())}>
            <FaCog />
          </IconButton>
        </ArrowTooltip>

        <ArrowTooltip title="GitHub Repository">
          <IconButton
            as="a"
            href="https://github.com/rohenaz/allaboard-bitchat-nitro"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub />
          </IconButton>
        </ArrowTooltip>

        <ArrowTooltip
          title={`${isMemberListOpen ? 'Hide' : 'Show'} Member List`}
        >
          <IconButton
            $isActive={isMemberListOpen}
            onClick={() => dispatch(toggleMemberList())}
          >
            <FaUserFriends />
          </IconButton>
        </ArrowTooltip>

        <ArrowTooltip title="Manage Profile on Sigma">
          <IconButton
            as="a"
            href="https://auth.sigmaidentity.com/profile"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImProfile />
          </IconButton>
        </ArrowTooltip>

        {!guest && (
          <ArrowTooltip title="Sign Out">
            <IconButton onClick={() => dispatch(logout())}>
              <FaSignOutAlt />
            </IconButton>
          </ArrowTooltip>
        )}

        {guest && (
          <ArrowTooltip title="Sign In">
            <IconButton onClick={() => navigate('/login')}>
              <FaSignInAlt />
            </IconButton>
          </ArrowTooltip>
        )}
      </ActionButtons>

      <SettingsModal />
    </Container>
  );
};

export default Header;
