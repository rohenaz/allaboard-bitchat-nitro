import { Hash, Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { loadChannels } from '../../reducers/channelsReducer';
import type { AppDispatch, RootState } from '../../store';
import ErrorBoundary from '../ErrorBoundary';
import DirectMessageModal from './modals/DirectMessageModal';

export interface Channel {
	id?: string;
	channel: string;
	last_message_time?: number;
	last_message?: string;
	messages?: number;
	creator?: string;
}

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
			<SidebarGroup>
				<SidebarGroupLabel>Text Channels</SidebarGroupLabel>
				<SidebarGroupContent>
					<div className="px-2 py-4 text-muted-foreground text-sm text-center">
						Loading channels...
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	return (
		<>
			<SidebarGroup>
				<SidebarGroupLabel>Text Channels ({channels.length})</SidebarGroupLabel>
				<SidebarGroupAction onClick={() => setShowDMModal(true)} title="Start Direct Message">
					<Plus className="h-4 w-4" />
				</SidebarGroupAction>
				<SidebarGroupContent>
					<SidebarMenu>
						{!channels.length && (
							<div className="px-2 py-4 text-muted-foreground text-sm text-center">
								No channels found
							</div>
						)}
						{channels.map((channel) => {
							const isActive = channel.channel === params.channel;
							return (
								<SidebarMenuItem key={channel.channel}>
									<SidebarMenuButton
										isActive={isActive}
										onClick={() => handleClick(channel.channel)}
										tooltip={channel.channel}
									>
										<Hash className="h-4 w-4" />
										<span>{channel.channel}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<DirectMessageModal open={showDMModal} onOpenChange={setShowDMModal} />
		</>
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
