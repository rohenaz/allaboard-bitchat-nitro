import type React from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { loadChannels } from '../../reducers/channelsReducer';
import type { AppDispatch, RootState } from '../../store';
import ErrorBoundary from '../ErrorBoundary';
import UserPanel from './UserPanel';

export interface Channel {
  id?: string;
  channel: string;
  last_message_time?: number;
  last_message?: string;
  messages?: number;
  creator?: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  position: relative;
  background: var(--b3);
`;

const Title = styled.h2`
  padding: 0.5rem 1rem;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--bc);
  opacity: 0.5;
`;

const ChannelList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ChannelItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.375rem 0.5rem;
  margin: 0.125rem 0.25rem;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--bc);
  opacity: ${({ $isActive }) => ($isActive ? '1' : '0.7')};
  background: ${({ $isActive }) => ($isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent')};
  transition: background 200ms;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ChannelName = styled.span<{ $isActive: boolean }>`
  color: var(--bc);
  opacity: ${({ $isActive }) => ($isActive ? '1' : '0.7')};
  transition: opacity 200ms;
`;

const HashtagIcon = styled.span`
  margin-right: 0.5rem;
  opacity: 0.5;
  font-size: 1.125rem;
  &::before {
    content: '#';
  }
`;

const LoadingText = styled.div`
  padding: 0.5rem 1rem;
  color: var(--bc);
  opacity: 0.5;
  font-size: 0.875rem;
`;

const NoChannelsText = styled(LoadingText)`
  color: var(--bc);
  opacity: 0.5;
`;

const ChannelListContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const params = useParams();

  const { loading, channels } = useSelector((state: RootState) => {
    const { byId, allIds, loading } = state.channels;
    return {
      loading,
      channels: allIds.map((id) => byId[id]).filter(Boolean),
    };
  });

  useEffect(() => {
    dispatch(loadChannels());
  }, [dispatch]);

  const handleClick = useCallback(
    (channelId: string) => {
      navigate(`/channels/${channelId}`);
    },
    [navigate],
  );

  if (loading) {
    return (
      <Container>
        <LoadingText>Loading channels...</LoadingText>
        <UserPanel />
      </Container>
    );
  }



  return (
    <Container>
      <Title>Text Channels ({channels.length})</Title>
      <ChannelList>
        {!channels.length && <NoChannelsText>No channels found</NoChannelsText>}
        {channels.map((channel) => (
          <ChannelItem
            key={channel.channel}
            $isActive={channel.channel === params.channel}
            onClick={() => handleClick(channel.channel)}
          >
            <HashtagIcon />
            <ChannelName $isActive={channel.channel === params.channel}>
              {channel.channel}
            </ChannelName>
          </ChannelItem>
        ))}
      </ChannelList>
      <UserPanel />
    </Container>
  );
};

const ChannelListWrapper: React.FC = () => {
  return (
    <ErrorBoundary>
      <ChannelListContent />
    </ErrorBoundary>
  );
};

export default ChannelListWrapper;
