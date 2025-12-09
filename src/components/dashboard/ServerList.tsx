import { Plus } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
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

const ServerList: FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	const servers = useSelector<RootState, ServerState>((state) => state.servers);
	const session = useSelector((state: RootState) => state.session);

	const handleServerClick = useCallback(
		(serverId: string) => {
			if (serverId === 'bitchat') {
				navigate('/channels');
			} else {
				navigate(`/servers/${serverId}`);
			}
		},
		[navigate],
	);

	const handleHomeClick = useCallback(() => {
		navigate('/friends');
	}, [navigate]);

	const handleAddServer = useCallback(() => {
		navigate('/servers/new');
	}, [navigate]);

	useEffect(() => {
		if (session.isAuthenticated) {
			void dispatch(loadChannels());
		}
	}, [session.isAuthenticated, dispatch]);

	return (
		<nav className="flex flex-col items-center bg-muted py-3 gap-2 overflow-y-auto overflow-x-hidden scrollbar-none">
			{/* Home/Friends Button */}
			<Tooltip content="Friends" placement="right">
				<Button
					variant="ghost"
					size="icon"
					onClick={handleHomeClick}
					className="w-12 h-12 rounded-2xl bg-primary hover:bg-primary/90 overflow-hidden p-0"
				>
					<Avatar
						size="48px"
						paymail="bitchat@bitchatnitro.com"
						icon="/images/blockpost-logo.svg"
					/>
				</Button>
			</Tooltip>

			<Separator className="w-8 my-1" />

			{/* Server List */}
			{servers.data.map((server) => (
				<Tooltip key={server._id} content={server.name} placement="right">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleServerClick(server._id)}
						className={cn(
							'w-12 h-12 rounded-full bg-background overflow-hidden p-0',
							'hover:rounded-2xl hover:bg-primary transition-all duration-150',
						)}
					>
						{server.icon ? (
							<Avatar size="48px" paymail={server.name} icon={server.icon} />
						) : (
							<span className="text-lg font-medium text-foreground">
								{server.name.charAt(0).toUpperCase()}
							</span>
						)}
					</Button>
				</Tooltip>
			))}

			{/* Add Server Button */}
			<Tooltip content="Add Server" placement="right">
				<Button
					variant="ghost"
					size="icon"
					onClick={handleAddServer}
					className={cn(
						'w-12 h-12 rounded-full bg-background text-chart-2',
						'hover:rounded-2xl hover:bg-chart-2 hover:text-foreground transition-all duration-150',
					)}
				>
					<Plus className="w-6 h-6" />
				</Button>
			</Tooltip>
		</nav>
	);
};

export default ServerList;
