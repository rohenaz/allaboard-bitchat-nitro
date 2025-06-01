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
        {session.user?.logo ? (
          <Avatar
            size="48px"
            paymail={session.user?.paymail}
            icon={session.user?.logo}
          />
        ) : (
          <ServerIcon>
            <svg width="28" height="20" viewBox="0 0 28 20" fill="currentColor">
              <path d="M20.6644 20C20.6644 20 19.8014 18.9762 19.0822 18.0714C22.2226 17.1905 23.4212 15.2381 23.4212 15.2381C22.4384 15.881 21.5014 16.3334 20.6644 16.6429C19.4658 17.1429 18.3151 17.4762 17.1918 17.6667C14.887 18.0952 12.7671 17.9762 10.9726 17.6429C9.61644 17.381 8.43836 17.0238 7.45548 16.6191C6.90411 16.4048 6.30137 16.1429 5.69863 15.8095C5.63014 15.7619 5.56164 15.7381 5.49315 15.6905C5.44521 15.6667 5.41781 15.6429 5.39041 15.6191C4.95890 15.381 4.71233 15.2143 4.71233 15.2143C4.71233 15.2143 5.86301 17.1191 8.91781 18.0238C8.20548 18.9286 7.32877 20 7.32877 20C2.06849 19.8333 0 16.381 0 16.381C0 8.7619 3.15068 2.61905 3.15068 2.61905C6.30137 0.19047 9.26027 0.238095 9.26027 0.238095L9.50685 0.571429C5.58904 1.71429 3.76712 3.52381 3.76712 3.52381C3.76712 3.52381 4.24658 3.28571 5.08219 2.95238C7.66438 1.85714 9.74658 1.52381 10.9726 1.38095C11.1918 1.35714 11.3836 1.33333 11.6027 1.33333C13.0548 1.14286 14.6918 1.09524 16.4178 1.28571C18.7945 1.57143 21.3493 2.38095 23.9589 3.52381C23.9589 3.52381 22.2466 1.80952 18.5479 0.666667L18.8493 0.238095C18.8493 0.238095 21.8082 0.19047 24.9589 2.61905C24.9589 2.61905 28.1096 8.7619 28.1096 16.381C28.1096 16.381 26.0411 19.8333 20.6644 20ZM9.93151 9.28571C9.93151 8.33333 10.6849 7.57143 11.6301 7.57143C12.5753 7.57143 13.3288 8.33333 13.3014 9.28571C13.3014 10.2381 12.5753 11 11.6301 11C10.6849 11 9.93151 10.2381 9.93151 9.28571ZM16.9178 9.28571C16.9178 8.33333 17.6712 7.57143 18.6164 7.57143C19.5342 7.57143 20.3151 8.33333 20.3151 9.28571C20.3151 10.2381 19.5616 11 18.6164 11C17.6712 11 16.9178 10.2381 16.9178 9.28571Z" />
            </svg>
          </ServerIcon>
        )}
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
