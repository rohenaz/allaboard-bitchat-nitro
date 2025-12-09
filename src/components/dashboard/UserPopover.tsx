import type React from 'react';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { api } from '../../api/fetch';
import { useBitcoin } from '../../context/bitcoin';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadFriends } from '../../reducers/memberListReducer';
import type { AppDispatch, RootState } from '../../store';
import Avatar from './Avatar';

interface User {
	_id: string;
	paymail: string;
	logo?: string;
	alternateName?: string;
	name?: string;
	idKey?: string;
	status?: 'online' | 'offline' | 'away' | 'dnd';
	customStatus?: string;
	joinedAt?: string;
	roles?: string[];
}

interface UserPopoverProps {
	user: User;
	targetRef: React.RefObject<HTMLElement>;
	isVisible: boolean;
	onClose: () => void;
	placement?: 'top' | 'bottom' | 'left' | 'right';
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const PopoverContainer = styled.div<{ $placement: string }>`
  position: absolute;
  z-index: 9999;
  background-color: var(--background-floating);
  border-radius: 8px;
  box-shadow: var(--elevation-high);
  border: 1px solid var(--background-modifier-accent);
  min-width: 300px;
  max-width: 350px;
  animation: ${fadeIn} 0.15s ease-out;
  overflow: hidden;

  ${({ $placement }) => {
		switch ($placement) {
			case 'top':
				return 'bottom: 100%; margin-bottom: 8px;';
			case 'bottom':
				return 'top: 100%; margin-top: 8px;';
			case 'left':
				return 'right: 100%; margin-right: 8px;';
			case 'right':
				return 'left: 100%; margin-left: 8px;';
			default:
				return 'top: 100%; margin-top: 8px;';
		}
	}}
`;

const PopoverHeader = styled.div`
  position: relative;
  background: linear-gradient(135deg, var(--brand-experiment) 0%, var(--brand-experiment-darker) 100%);
  padding: 16px;
  color: white;
`;

const UserInfoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const DisplayName = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: 2px;
  word-break: break-word;
`;

const Username = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIndicator = styled.div<{ $status: string }>`
  width: 12px;
  height: 12px;
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
  border: 2px solid white;
`;

const StatusText = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
`;

const CustomStatus = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
  font-style: italic;
`;

const PopoverBody = styled.div`
  padding: 16px;
`;

const InfoSection = styled.div`
  margin-bottom: 16px;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 14px;
  color: var(--text-normal);
  word-break: break-word;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const ActionButton = styled.button<{
	$variant?: 'primary' | 'secondary' | 'danger';
}>`
  flex: 1;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  ${({ $variant = 'secondary' }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: var(--brand-experiment);
          color: white;
          &:hover {
            background-color: var(--brand-experiment-darker);
          }
        `;
			case 'danger':
				return `
          background-color: var(--status-danger);
          color: white;
          &:hover {
            background-color: var(--status-danger-darker);
          }
        `;
			default:
				return `
          background-color: var(--background-secondary);
          color: var(--text-normal);
          &:hover {
            background-color: var(--background-modifier-hover);
          }
        `;
		}
	}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: var(--background-modifier-accent);
  margin: 12px 0;
`;

const RoleTag = styled.span`
  display: inline-block;
  background-color: var(--brand-experiment);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 4px;
  margin-bottom: 4px;
`;

export const UserPopover: FC<UserPopoverProps> = ({
	user,
	targetRef,
	isVisible,
	onClose,
	placement = 'bottom',
}) => {
	const { authToken } = useHandcash();
	const { connected } = useYours();
	const { sendFriendRequest } = useBitcoin();
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const session = useSelector((state: RootState) => state.session);

	const isAuthenticated = authToken || connected;
	const isOwnProfile = session.user?.paymail === user.paymail;

	// Calculate position
	useEffect(() => {
		if (!isVisible || !targetRef.current) return;

		const targetRect = targetRef.current.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let top = targetRect.bottom + 8;
		let left = targetRect.left;

		// Adjust if popover would go off screen
		if (left + 350 > viewportWidth) {
			left = viewportWidth - 350 - 16;
		}
		if (top + 400 > viewportHeight) {
			top = targetRect.top - 400 - 8;
		}

		setPosition({ top, left });
	}, [isVisible, targetRef]);

	// Close on escape or click outside
	useEffect(() => {
		if (!isVisible) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};

		const handleClickOutside = (e: MouseEvent) => {
			const popover = document.querySelector('[data-user-popover]');
			if (popover && !popover.contains(e.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isVisible, onClose]);

	const handleSendMessage = useCallback(async () => {
		if (!user.idKey || !session.user?.idKey) return;

		try {
			setActionLoading('message');
			const channel = await api.post<{ id: string }>('/channels', {
				type: 'dm',
				members: [session.user.idKey, user.idKey],
			});
			navigate(`/channels/${channel.id}`);
			onClose();
		} catch (error) {
			console.error('Failed to create DM:', error);
		} finally {
			setActionLoading(null);
		}
	}, [user.idKey, session.user?.idKey, navigate, onClose]);

	const handleAddFriend = useCallback(async () => {
		if (!user.idKey) {
			console.error('Cannot send friend request: missing user ID');
			return;
		}

		try {
			setActionLoading('friend');
			// Use Bitcoin context to broadcast friend request with public key
			// Key derivation happens via sigma plugin (Type42 from member WIF)
			await sendFriendRequest(user.idKey);
			await dispatch(loadFriends());
			onClose();
		} catch (error) {
			console.error('Failed to send friend request:', error);
		} finally {
			setActionLoading(null);
		}
	}, [user.idKey, sendFriendRequest, dispatch, onClose]);

	const handleViewProfile = useCallback(() => {
		navigate(`/@/${user.paymail}`);
		onClose();
	}, [user.paymail, navigate, onClose]);

	if (!isVisible) return null;

	return (
		<>
			<div
				style={{
					position: 'fixed',
					inset: 0,
					zIndex: 999,
					background: 'transparent',
				}}
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onClose();
					}
				}}
				role="button"
				tabIndex={-1}
				aria-label="Close popover"
			/>
			<PopoverContainer
				data-user-popover
				$placement={placement}
				style={{
					position: 'fixed',
					top: position.top,
					left: position.left,
				}}
			>
				<PopoverHeader>
					<UserInfoSection>
						<Avatar size="64px" paymail={user.paymail} icon={user.logo} />
						<UserDetails>
							<DisplayName>
								{user.alternateName || user.name || user.paymail?.split('@')[0] || 'Anonymous'}
							</DisplayName>
							<Username>@{user.paymail}</Username>
						</UserDetails>
					</UserInfoSection>

					<StatusSection>
						<StatusIndicator $status={user.status || 'offline'} />
						<StatusText>
							{user.status === 'online'
								? 'Online'
								: user.status === 'away'
									? 'Away'
									: user.status === 'dnd'
										? 'Do Not Disturb'
										: 'Offline'}
						</StatusText>
					</StatusSection>

					{user.customStatus && <CustomStatus>"{user.customStatus}"</CustomStatus>}
				</PopoverHeader>

				<PopoverBody>
					<InfoSection>
						<InfoLabel>Member Since</InfoLabel>
						<InfoValue>
							{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}
						</InfoValue>
					</InfoSection>

					{user.roles && user.roles.length > 0 && (
						<InfoSection>
							<InfoLabel>Roles</InfoLabel>
							<div>
								{user.roles.map((role) => (
									<RoleTag key={role}>{role}</RoleTag>
								))}
							</div>
						</InfoSection>
					)}

					<Divider />

					{!isOwnProfile && isAuthenticated && (
						<ActionButtons>
							<ActionButton
								$variant="primary"
								onClick={handleSendMessage}
								disabled={actionLoading === 'message'}
								title="Send Direct Message"
							>
								{actionLoading === 'message' ? '...' : 'Message'}
							</ActionButton>

							<ActionButton
								onClick={handleAddFriend}
								disabled={actionLoading === 'friend'}
								title="Send Friend Request"
							>
								{actionLoading === 'friend' ? '...' : 'Add Friend'}
							</ActionButton>
						</ActionButtons>
					)}

					<ActionButtons>
						<ActionButton onClick={handleViewProfile} title="View Full Profile">
							View Profile
						</ActionButton>
					</ActionButtons>
				</PopoverBody>
			</PopoverContainer>
		</>
	);
};
