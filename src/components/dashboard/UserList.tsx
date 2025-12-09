import type { FC } from 'react';
import { useRef, useState } from 'react';
import { FaComments, FaEllipsisV, FaUserCheck, FaUserMinus, FaUserPlus } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
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

const Container = styled.div`
  height: 100%;
  background-color: var(--background-secondary);
  border-left: 1px solid var(--background-modifier-accent);
`;

const Title = styled.div`
  padding: 16px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--background-modifier-accent);
`;

const UserItem = styled.div<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  background-color: ${({ $isActive }) =>
		$isActive ? 'var(--background-modifier-selected)' : 'transparent'};
  
  &:hover {
    background-color: var(--background-modifier-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--brand-experiment);
    outline-offset: -2px;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Username = styled.div<{ $isActive?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ $isActive }) => ($isActive ? 'var(--text-normal)' : 'var(--channels-default)')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserStatus = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatusDot = styled.div<{ $status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ $status }) => {
		switch ($status) {
			case 'online':
				return 'var(--status-positive)';
			case 'away':
				return 'var(--status-warning)';
			case 'dnd':
				return 'var(--status-danger)';
			default:
				return 'var(--text-muted)';
		}
	}};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0;

  ${UserItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  &:focus-visible {
    opacity: 1;
    outline: 2px solid var(--brand-experiment);
    outline-offset: -2px;
  }
`;

const Section = styled.div`
  border-bottom: 1px solid var(--background-modifier-accent);
`;

const SectionTitle = styled.div`
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  background-color: var(--background-secondary-alt);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--text-muted);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
`;

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
			<Container>
				{title && <Title>{title}</Title>}
				<LoadingContainer>
					<div className="loading loading-spinner loading-md" />
				</LoadingContainer>
			</Container>
		);
	}

	return (
		<Container>
			{title && <Title>{title}</Title>}

			{showFriendRequests && (
				<Section>
					<SectionTitle>Incoming Friend Requests</SectionTitle>
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
								<UserItem
									ref={(ref: HTMLDivElement | null) => {
										if (ref) userRefs.current[id] = ref;
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
									role="button"
									tabIndex={0}
									aria-label={`User ${signer.paymail}`}
								>
									<Avatar size="32px" paymail={signer.paymail || ''} icon={signer.logo || ''} />
									<UserInfo>
										<Username>{signer.paymail}</Username>
										<UserStatus>
											<StatusDot $status="offline" />
											Friend Request
										</UserStatus>
									</UserInfo>

									<Tooltip content="More options" placement="left">
										<ActionButton aria-label="More options" onClick={(e) => e.stopPropagation()}>
											<FaEllipsisV />
										</ActionButton>
									</Tooltip>
								</UserItem>
							</ContextMenu>
						);
					})}
				</Section>
			)}

			<Section>
				<SectionTitle>
					{showFriendRequests ? 'Friends' : 'Members'} — {users.length}
				</SectionTitle>

				{users.length === 0 ? (
					<EmptyState>
						{showFriendRequests
							? 'No friends yet. Add some friends to get started!'
							: 'No members online'}
					</EmptyState>
				) : (
					users.map((user) => (
						<ContextMenu key={user.id} items={createContextMenuItems(user)}>
							<UserItem
								ref={(ref: HTMLDivElement | null) => {
									if (ref) userRefs.current[user.id] = ref;
								}}
								$isActive={activeUserId === user.id}
								onClick={() => handleUserClick(user)}
								role="button"
								tabIndex={0}
								aria-label={`User ${user.name}`}
								aria-pressed={activeUserId === user.id}
							>
								<Avatar size="32px" paymail={user.paymail || ''} icon={user.avatar} />
								<UserInfo>
									<Username $isActive={activeUserId === user.id}>{user.name}</Username>
									<UserStatus>
										<StatusDot $status={user.status} />
										{user.status === 'online' ? 'Online' : 'Offline'}
									</UserStatus>
								</UserInfo>

								<Tooltip content="More options" placement="left">
									<ActionButton aria-label="More options" onClick={(e) => e.stopPropagation()}>
										<FaEllipsisV />
									</ActionButton>
								</Tooltip>
							</UserItem>

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
			</Section>
		</Container>
	);
};
