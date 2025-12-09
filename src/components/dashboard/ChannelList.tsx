import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { loadChannels } from '../../reducers/channelsReducer';
import type { AppDispatch, RootState } from '../../store';
import ErrorBoundary from '../ErrorBoundary';
import DirectMessageModal from './modals/DirectMessageModal';
import UserPanel from './UserPanel';

export interface Channel {
	id?: string;
	channel: string;
	last_message_time?: number;
	last_message?: string;
	messages?: number;
	creator?: string;
}

const Container = styled.aside`
  display: flex;
  flex-direction: column;
  background-color: var(--card);
  position: relative;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 8px 16px;
  height: 48px;
`;

const Title = styled.h2`
  text-transform: uppercase;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: var(--muted-foreground);
  margin: 0;
  user-select: none;
  display: flex;
  align-items: center;
`;

const AddDMButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 14px;
    height: 14px;
    stroke-width: 2.5;
  }
`;

const ChannelListStyled = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0 8px;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ChannelItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 1px 8px;
  margin: 1px 0;
  border-radius: 4px;
  cursor: pointer;
  color: ${({ $isActive }) => ($isActive ? 'var(--primary)' : 'var(--muted-foreground)')};
  background: ${({ $isActive }) => ($isActive ? 'var(--accent)' : 'transparent')};
  transition: all 0.15s ease-out;
  height: 32px;
  max-width: 224px;
  position: relative;

  &:hover {
    background: var(--accent);
    color: var(--foreground);
  }

  ${({ $isActive }) =>
		$isActive &&
		`
    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: var(--foreground);
      border-radius: 0 4px 4px 0;
    }
  `}
`;

const ChannelName = styled.span<{ $isActive: boolean }>`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HashtagIcon = styled.span`
  margin-right: 6px;
  font-size: 20px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
  &::before {
    content: '#';
  }
`;

const LoadingText = styled.div`
  padding: 16px;
  color: var(--muted-foreground);
  font-size: 14px;
  text-align: center;
`;

const NoChannelsText = styled(LoadingText)`
  color: var(--muted-foreground);
`;

const ChannelListContent: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const params = useParams();
	const [showDMModal, setShowDMModal] = useState(false);

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
			</Container>
		);
	}

	return (
		<Container>
			<TitleRow>
				<Title>Text Channels ({channels.length})</Title>
				<AddDMButton onClick={() => setShowDMModal(true)} title="Start Direct Message">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2}
						stroke="currentColor"
						aria-hidden="true"
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
				</AddDMButton>
			</TitleRow>
			<ChannelListStyled>
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
			</ChannelListStyled>
			<UserPanel />
			<DirectMessageModal open={showDMModal} onOpenChange={setShowDMModal} />
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
