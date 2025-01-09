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
import tw from 'twin.macro';
import { useHandcash } from '../../context/handcash';
import { hideInDesktop } from '../../design/mixins';
import { useActiveUser } from '../../hooks';
import { toggleMemberList } from '../../reducers/memberListReducer';
import { toggleProfile } from '../../reducers/profileReducer';
import { logout } from '../../reducers/sessionReducer';
import { toggleSettings } from '../../reducers/settingsReducer';
import { toggleSidebar } from '../../reducers/sidebarReducer';
import type { RootState } from '../../store';
import ArrowTooltip from './ArrowTooltip';
import At from './At';
import Hashtag from './Hashtag';
import { SettingsModal } from './modals/SettingsModal';

const Container = styled.div`
  ${tw`bg-base-200 border-b border-base-300 h-12 flex-none px-4 flex items-center justify-between w-full`}
`;

const Heading = tw.div`
  font-semibold
  text-sm
  md:text-base
  whitespace-nowrap
  text-ellipsis
  text-base-content
`;

interface IconWrapperProps {
  $isActive?: boolean;
  $isHamburger?: boolean;
  as?: string;
  href?: string;
  target?: string;
}

const IconWrapper = styled.button<IconWrapperProps>`
  ${tw`flex items-center content-center mr-2 md:mr-3 text-base-content hover:bg-base-300`}
  background-color: transparent;
  padding: 4px;
  border-radius: 4px;
  font-size: 20px;
  
  ${(p) => p.$isHamburger && hideInDesktop};
  ${(p) => p.$isActive && tw`text-base-content bg-base-300`};
`;

interface IconButtonProps {
  children: ReactElement | string;
  href?: string;
  isActive?: boolean;
  isHamburger?: boolean;
  target?: string;
  onClick?: () => void;
}

const IconButton = ({
  children,
  href,
  isActive,
  isHamburger,
  target,
  onClick,
}: IconButtonProps) => {
  const tag = href ? 'a' : 'button';
  const type = tag === 'button' ? 'button' : undefined;

  return (
    <IconWrapper
      as={tag}
      type={type}
      href={href}
      target={target}
      $isActive={isActive}
      $isHamburger={isHamburger}
      onClick={onClick}
    >
      {children}
    </IconWrapper>
  );
};

const ActionButtons = tw.div`
  flex
  items-center
  gap-1
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
  const isProfileOpen = useSelector((state: RootState) => state.profile.isOpen);
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

  return (
    <Container id="header" className="disable-select">
      <div className="flex flex-1">
        <div className="flex items-center justify-center">
          <IconButton onClick={() => dispatch(toggleSidebar())} isHamburger>
            <FaBars className="mr-2" />
          </IconButton>
          <div className="flex items-center relative">
            {activeChannelId && <Hashtag className="mr-1" />}
            {activeUserId && <At />}

            <Heading>
              {(isFriendsPage
                ? 'Friends'
                : !channels?.loading && activeChannelId) ||
                profile?.paymail ||
                activeUser?.paymail ||
                activeUserId ||
                'global chat'}
            </Heading>
          </div>
        </div>
      </div>
      <ActionButtons>
        <ArrowTooltip title="Settings">
          <IconButton onClick={() => dispatch(toggleSettings())}>
            <FaCog />
          </IconButton>
        </ArrowTooltip>
        <ArrowTooltip title="GitHub Repo">
          <IconButton
            href="https://github.com/rohenaz/allaboard-bitchat-nitro"
            target="_blank"
          >
            <FaGithub />
          </IconButton>
        </ArrowTooltip>
        <ArrowTooltip
          title={`${isMemberListOpen ? 'Hide' : 'Show'} Member list`}
        >
          <IconButton
            onClick={() => dispatch(toggleMemberList())}
            isActive={isMemberListOpen}
          >
            <FaUserFriends />
          </IconButton>
        </ArrowTooltip>
        <ArrowTooltip title={`${isProfileOpen ? 'Hide' : 'Show'} Profile`}>
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
