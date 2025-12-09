import { Hash, Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
			<aside className="flex flex-col bg-card relative">
				<div className="p-4 text-muted-foreground text-sm text-center">Loading channels...</div>
			</aside>
		);
	}

	return (
		<aside className="flex flex-col bg-card relative">
			<div className="flex items-center justify-between px-4 pt-4 pb-2 h-12">
				<h2 className="uppercase font-semibold text-xs leading-4 text-muted-foreground m-0 select-none flex items-center">
					Text Channels ({channels.length})
				</h2>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setShowDMModal(true)}
					title="Start Direct Message"
					className="h-[18px] w-[18px] text-muted-foreground hover:text-foreground hover:bg-accent"
				>
					<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
				</Button>
			</div>

			<div className="flex flex-col flex-1 px-2 overflow-y-auto scrollbar-none">
				{!channels.length && (
					<div className="p-4 text-muted-foreground text-sm text-center">No channels found</div>
				)}
				{channels.map((channel) => {
					const isActive = channel.channel === params.channel;
					return (
						<Button
							key={channel.channel}
							variant="ghost"
							onClick={() => handleClick(channel.channel)}
							className={cn(
								'flex items-center justify-start px-2 py-px my-px rounded h-8 max-w-[224px] relative transition-all w-full',
								isActive
									? 'text-primary bg-accent before:absolute before:left-[-8px] before:top-0 before:bottom-0 before:w-1 before:bg-foreground before:rounded-r'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground',
							)}
						>
							<Hash className="mr-1.5 h-5 w-5 text-muted-foreground flex-shrink-0" />
							<span className="font-medium text-base leading-5 overflow-hidden text-ellipsis whitespace-nowrap">
								{channel.channel}
							</span>
						</Button>
					);
				})}
			</div>

			<UserPanel />
			<DirectMessageModal open={showDMModal} onOpenChange={setShowDMModal} />
		</aside>
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
