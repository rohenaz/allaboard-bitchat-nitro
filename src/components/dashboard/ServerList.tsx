import type { FC } from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadChannels } from '../../reducers/channelsReducer';
import type { AppDispatch, RootState } from '../../store';
import Avatar from './Avatar';

interface Server {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  paymail?: string;
}

interface ServerState {
  loading: boolean;
  error: string | null;
  data: Server[];
}

interface SessionUser {
  idKey?: string;
  paymail?: string;
  logo?: string;
}

interface SessionState {
  user?: SessionUser | null;
}

const Container = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--background-tertiary);
  padding: 12px 0;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ServerButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--background-primary);
  border: none;
  cursor: pointer;
  transition: all 0.15s ease-out;
  overflow: hidden;
  position: relative;

  &:hover {
    border-radius: 16px;
    background-color: var(--brand-experiment);
  }

  &.active {
    border-radius: 16px;
    background-color: var(--brand-experiment);
  }
`;

const HomeButton = styled(ServerButton)`
  background-color: var(--brand-experiment);
  border-radius: 16px;
  
  &:hover {
    background-color: var(--brand-experiment-hover);
  }
`;

const AddButton = styled(ServerButton)`
  background-color: var(--background-primary);
  color: var(--green-360);
  
  &:hover {
    background-color: var(--green-360);
    color: var(--white-500);
  }
`;

const Separator = styled.div`
  width: 32px;
  height: 2px;
  background-color: var(--background-modifier-accent);
  border-radius: 1px;
  margin: 4px 0;
`;

const ServerIcon = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-normal);
  font-weight: 500;
  font-size: 18px;
`;

const PlusIcon = styled.svg`
  width: 24px;
  height: 24px;
`;

const ServerList: FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const servers = useSelector<RootState, ServerState>((state) => state.servers);
  const session = useSelector<RootState, SessionState>(
    (state) => state.session,
  );

  const handleServerClick = useCallback(
    (serverId: string) => {
      navigate(`/servers/${serverId}`);
    },
    [navigate],
  );

  const handleHomeClick = useCallback(() => {
    navigate('/channels');
  }, [navigate]);

  const handleAddServer = useCallback(() => {
    navigate('/servers/new');
  }, [navigate]);

  useEffect(() => {
    if (authToken || connected) {
      void dispatch(loadChannels());
    }
  }, [authToken, connected, dispatch]);

  return (
    <Container>
      <HomeButton onClick={handleHomeClick}>
        <Avatar
          size="48px"
          paymail="bitchat@bitchatnitro.com"
          icon="/images/blockpost-logo.svg"
        />
      </HomeButton>

      <Separator />

      {servers.data.map((server) => (
        <ServerButton
          key={server._id}
          onClick={() => handleServerClick(server._id)}
        >
          {server.icon ? (
            <Avatar size="48px" paymail={server.name} icon={server.icon} />
          ) : (
            <ServerIcon>{server.name.charAt(0).toUpperCase()}</ServerIcon>
          )}
        </ServerButton>
      ))}

      <AddButton onClick={handleAddServer}>
        <PlusIcon
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </PlusIcon>
      </AddButton>
    </Container>
  );
};

export default ServerList;
