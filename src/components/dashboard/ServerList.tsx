import type React from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { fetchServers } from '../../reducers/serverReducer';
import Avatar from './Avatar';

interface Server {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  icon?: string;
  paymail?: string;
}

interface RootState {
  servers: {
    loading: boolean;
    data: Server[];
  };
  session: {
    user?: {
      bapId?: string;
    };
  };
}

const Container = styled.div`
  width: 72px;
  min-width: 72px;
  background-color: var(--background-tertiary);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 0;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  flex-shrink: 0;
`;

const Separator = styled.div`
  width: 32px;
  height: 2px;
  border-radius: 1px;
  background-color: var(--background-modifier-accent);
  margin: 0 0 8px;
`;

const ServerButton = styled.button<{ $active?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ $active }) => ($active ? '16px' : '24px')};
  margin-bottom: 8px;
  position: relative;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
  transition: border-radius 0.15s ease-out;

  &:hover {
    border-radius: 16px;
  }

  &::before {
    content: '';
    display: block;
    width: 8px;
    height: ${({ $active }) => ($active ? '40px' : '8px')};
    position: absolute;
    left: -16px;
    top: 50%;
    transform: translateY(-50%) scale(${({ $active }) => ($active ? 1 : 0)});
    border-radius: 0 4px 4px 0;
    background-color: var(--header-primary);
    transition: all 0.15s ease-out;
  }

  &:hover::before {
    transform: translateY(-50%) scale(1);
    height: 20px;
  }
`;

const ServerList: React.FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const servers = useSelector((state: RootState) => state.servers);

  const fetchServerList = useCallback(() => {
    if (authToken || connected) {
      dispatch(fetchServers());
    }
  }, [authToken, connected, dispatch]);

  useEffect(() => {
    fetchServerList();
  }, [fetchServerList]);

  const handleClick = useCallback(
    (id: string) => {
      navigate(`/channels/${id}`);
    },
    [navigate],
  );

  if (servers.loading) {
    return null;
  }

  return (
    <Container>
      <ServerButton
        $active={!params.channel}
        onClick={() => navigate('/channels/@me')}
      >
        <Avatar
          size="48px"
          bgcolor={'#000'}
          paymail="bitchat@bitchatnitro.com"
          icon="/logo.png"
        />
      </ServerButton>
      <Separator />
      {servers.data?.map((server) => (
        <ServerButton
          key={server._id}
          $active={server._id === params.channel}
          onClick={() => handleClick(server._id)}
        >
          <Avatar
            size="48px"
            bgcolor={'#000'}
            paymail={server.paymail}
            icon={server.icon}
          />
        </ServerButton>
      ))}
    </Container>
  );
};

export default ServerList;
