import { Loader2, MessageSquare, MoreVertical, UserCheck, UserMinus, UserPlus } from 'lucide-react';
import type { FC } from 'react';
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { RootState } from '../../store';
import { ContextMenu } from '../ui/ContextMenu';
import { Tooltip } from '../ui/tooltip';
import Avatar from './Avatar';
import { UserPopover } from './UserPopover';

interface User {
	id: string;
	name: string;
	avatar: string;
	paymail?: string;
	bapId: string;
	idKey: string;
	status: 'online' | 'offline';
}

interface UserListProps {
	users?: User[];
	loading?: boolean;
	title?: string;
	showFriendRequests?: boolean;
	activeUserId?: string;
}

const StatusDot: FC<{ status: string }> = ({ status }) => {
	const colorClass =
		status === 'online'
			? 'bg-chart-2'
			: status === 'away'
				? 'bg-yellow-500'
				: status === 'dnd'
					? 'bg-destructive'
					: 'bg-muted-foreground';

	return <div className={cn('w-2 h-2 rounded-full', colorClass)} />;
};

export const UserList: FC<UserListProps> = ({
	activeUserId,
	users = [],
	loading = false,
	title,
	showFriendRequests = false,
}) => {
	const [activePopover, setActivePopover] = useState<string | null>(null);
	const userRefs = useRef<Record<string, HTMLDivElement>>({});

	const friendRequests = useSelector((state: RootState) => state.memberList.friendRequests);

	const isLoading = showFriendRequests ? loading || friendRequests.loading : loading;

	const handleUserClick = (user: User) => {
		setActivePopover(activePopover === user.id ? null : user.id);
	};

	const handleClosePopover = () => {
		setActivePopover(null);
	};

	const createContextMenuItems = (_user: User) => [
		{
			id: 'profile',
			label: 'View Profile',
			icon: <UserCheck className="h-4 w-4" />,
			onClick: () => {
				// Navigate to profile
			},
		},
		{
			id: 'message',
			label: 'Send Message',
			icon: <MessageSquare className="h-4 w-4" />,
			onClick: () => {
				// Create DM
			},
		},
		{
			id: 'separator1',
			label: '',
			separator: true,
			onClick: () => {},
		},
		{
			id: 'add-friend',
			label: 'Add Friend',
			icon: <UserPlus className="h-4 w-4" />,
			onClick: () => {
				// Send friend request
			},
		},
		{
			id: 'separator2',
			label: '',
			separator: true,
			onClick: () => {},
		},
		{
			id: 'remove',
			label: 'Remove Friend',
			icon: <UserMinus className="h-4 w-4" />,
			danger: true,
			onClick: () => {
				// Remove friend
			},
		},
	];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8 px-4 text-muted-foreground">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	return (
		<>
			{showFriendRequests && friendRequests.incoming.allIds.length > 0 && (
				<SidebarMenu>
					<div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase">
						Friend Requests
					</div>
					{friendRequests.incoming.allIds.map((id) => {
						const request = friendRequests.incoming.byId[id];
						const signer = request.signer;
						if (!signer) return null;

						return (
							<SidebarMenuItem key={id}>
								<ContextMenu
									items={createContextMenuItems({
										id,
										name: signer.paymail || 'Unknown',
										avatar: signer.logo || '',
										paymail: signer.paymail || '',
										bapId: id,
										idKey: id,
										status: 'offline' as const,
									})}
								>
									<SidebarMenuButton
										onClick={() =>
											handleUserClick({
												id,
												name: signer.paymail || 'Unknown',
												avatar: signer.logo || '',
												paymail: signer.paymail || '',
												bapId: id,
												idKey: id,
												status: 'offline' as const,
											})
										}
										className="h-auto py-2"
									>
										<Avatar size="32px" paymail={signer.paymail || ''} icon={signer.logo || ''} />
										<div className="flex-1 min-w-0 flex flex-col gap-0.5">
											<span className="text-sm font-medium truncate">{signer.paymail}</span>
											<span className="text-xs text-muted-foreground flex items-center gap-1">
												<StatusDot status="offline" />
												Friend Request
											</span>
										</div>
									</SidebarMenuButton>
								</ContextMenu>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			)}

			<SidebarMenu>
				{users.length === 0 ? (
					<div className="flex flex-col items-center py-8 px-4 text-center text-muted-foreground text-sm">
						{showFriendRequests
							? 'No friends yet. Add some friends to get started!'
							: 'No members in this channel'}
					</div>
				) : (
					users.map((user) => (
						<SidebarMenuItem key={user.id}>
							<ContextMenu items={createContextMenuItems(user)}>
								<SidebarMenuButton
									ref={(ref: HTMLButtonElement | null) => {
										if (ref) userRefs.current[user.id] = ref as unknown as HTMLDivElement;
									}}
									onClick={() => handleUserClick(user)}
									isActive={activeUserId === user.id}
									className="h-auto py-2"
								>
									<Avatar size="32px" paymail={user.paymail || ''} icon={user.avatar} />
									<div className="flex-1 min-w-0 flex flex-col gap-0.5">
										<span className="text-sm font-medium truncate">{user.name}</span>
										<span className="text-xs text-muted-foreground flex items-center gap-1">
											<StatusDot status={user.status} />
											{user.status === 'online' ? 'Online' : 'Offline'}
										</span>
									</div>
									<Tooltip content="More options" placement="left">
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 opacity-0 group-hover:opacity-100"
											onClick={(e) => e.stopPropagation()}
										>
											<MoreVertical className="h-3 w-3" />
										</Button>
									</Tooltip>
								</SidebarMenuButton>
							</ContextMenu>

							{/* User Popover */}
							{activePopover === user.id && userRefs.current[user.id] && (
								<UserPopover
									user={{
										_id: user.id,
										paymail: user.paymail || '',
										logo: user.avatar,
										alternateName: user.name,
										idKey: user.idKey,
										status: user.status,
									}}
									targetRef={{ current: userRefs.current[user.id] }}
									isVisible={true}
									onClose={handleClosePopover}
									placement="left"
								/>
							)}
						</SidebarMenuItem>
					))
				)}
			</SidebarMenu>
		</>
	);
};
