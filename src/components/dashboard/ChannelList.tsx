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
  padding: 16px 0;
  overflow-y: auto;
  position: relative;
  padding-bottom: 52px;
`;

const Title = styled.h2`
  padding: 0 16px;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 12px;
  height: 24px;
  line-height: 24px;
  color: var(--channels-default);
`;

const ChannelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
`;

const ChannelItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 6px 8px;
  color: var(--channels-default);
  border-radius: 4px;
  cursor: pointer;
  font-size: 15px;
  user-select: none;

  &:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  ${({ $isActive }) =>
    $isActive &&
    `
    background-color: var(--background-modifier-selected);
    color: var(--text-normal);
  `}
`;

const HashtagIcon = styled.span`
  margin-right: 6px;
  color: var(--channels-default);
  font-size: 20px;
  
  &::before {
    content: '#';
  }
`;

const LoadingText = styled.div`
  padding: 0 16px;
  color: var(--text-muted);
  font-size: 14px;
`;

const NoChannelsText = styled(LoadingText)`
  color: var(--text-muted);
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

  if (!channels.length) {
    return (
      <Container>
        <NoChannelsText>No channels found</NoChannelsText>
        <UserPanel />
      </Container>
    );
  }

  return (
    <Container>
      <Title>Text Channels ({channels.length})</Title>
      <ChannelList>
        {channels.map((channel) => (
          <ChannelItem
            key={channel.channel}
            $isActive={channel.channel === params.channel}
            onClick={() => handleClick(channel.channel)}
          >
            <HashtagIcon />
            {channel.channel}
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
