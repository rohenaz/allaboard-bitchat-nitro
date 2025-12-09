import { Loader2 } from 'lucide-react';
import type { FC } from 'react';
import { useRef, useState } from 'react';
import { FaComments, FaEllipsisV, FaUserCheck, FaUserMinus, FaUserPlus } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RootState } from '../../store';
import { ContextMenu } from '../ui/ContextMenu';
import { Tooltip } from '../ui/Tooltip';
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
			icon: <FaUserCheck />,
			onClick: () => {
				// Navigate to profile
			},
		},
		{
			id: 'message',
			label: 'Send Message',
			icon: <FaComments />,
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
			icon: <FaUserPlus />,
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
			icon: <FaUserMinus />,
			danger: true,
			onClick: () => {
				// Remove friend
			},
		},
	];

	if (isLoading) {
		return (
			<div className="h-full bg-card border-l border-border">
				{title && (
					<div className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wide border-b border-border">
						{title}
					</div>
				)}
				<div className="flex items-center justify-center py-8 px-4 text-muted-foreground">
					<Loader2 className="h-6 w-6 animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="h-full bg-card border-l border-border">
			{title && (
				<div className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wide border-b border-border">
					{title}
				</div>
			)}

			{showFriendRequests && (
				<div className="border-b border-border">
					<div className="py-2 px-4 text-[11px] font-bold text-muted-foreground uppercase bg-card">
						Incoming Friend Requests
					</div>
					{friendRequests.incoming.allIds.map((id) => {
						const request = friendRequests.incoming.byId[id];
						const signer = request.signer;
						if (!signer) return null;

						return (
							<ContextMenu
								key={id}
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
								<Button
									variant="ghost"
									ref={(ref: HTMLButtonElement | null) => {
										if (ref) userRefs.current[id] = ref as unknown as HTMLDivElement;
									}}
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
									aria-label={`User ${signer.paymail}`}
									className="group flex items-center justify-start gap-3 py-2 px-4 h-auto w-full rounded-none"
								>
									<Avatar size="32px" paymail={signer.paymail || ''} icon={signer.logo || ''} />
									<div className="flex-1 min-w-0 flex flex-col gap-0.5">
										<div className="text-sm font-medium text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
											{signer.paymail}
										</div>
										<div className="text-xs text-muted-foreground flex items-center gap-1">
											<StatusDot status="offline" />
											Friend Request
										</div>
									</div>

									<Tooltip content="More options" placement="left">
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
											aria-label="More options"
											onClick={(e) => e.stopPropagation()}
										>
											<FaEllipsisV className="h-3 w-3" />
										</Button>
									</Tooltip>
								</Button>
							</ContextMenu>
						);
					})}
				</div>
			)}

			<div className="border-b border-border">
				<div className="py-2 px-4 text-[11px] font-bold text-muted-foreground uppercase bg-card">
					{showFriendRequests ? 'Friends' : 'Members'} — {users.length}
				</div>

				{users.length === 0 ? (
					<div className="flex flex-col items-center py-8 px-4 text-center text-muted-foreground text-sm">
						{showFriendRequests
							? 'No friends yet. Add some friends to get started!'
							: 'No members online'}
					</div>
				) : (
					users.map((user) => (
						<ContextMenu key={user.id} items={createContextMenuItems(user)}>
							<Button
								variant="ghost"
								ref={(ref: HTMLButtonElement | null) => {
									if (ref) userRefs.current[user.id] = ref as unknown as HTMLDivElement;
								}}
								onClick={() => handleUserClick(user)}
								aria-label={`User ${user.name}`}
								aria-pressed={activeUserId === user.id}
								className={cn(
									'group flex items-center justify-start gap-3 py-2 px-4 h-auto w-full rounded-none',
									activeUserId === user.id ? 'bg-accent' : '',
								)}
							>
								<Avatar size="32px" paymail={user.paymail || ''} icon={user.avatar} />
								<div className="flex-1 min-w-0 flex flex-col gap-0.5">
									<div
										className={cn(
											'text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap',
											activeUserId === user.id ? 'text-foreground' : 'text-muted-foreground',
										)}
									>
										{user.name}
									</div>
									<div className="text-xs text-muted-foreground flex items-center gap-1">
										<StatusDot status={user.status} />
										{user.status === 'online' ? 'Online' : 'Offline'}
									</div>
								</div>

								<Tooltip content="More options" placement="left">
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
										aria-label="More options"
										onClick={(e) => e.stopPropagation()}
									>
										<FaEllipsisV className="h-3 w-3" />
									</Button>
								</Tooltip>
							</Button>

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
						</ContextMenu>
					))
				)}
			</div>
		</div>
	);
};
