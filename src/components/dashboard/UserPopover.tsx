import type React from 'react';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'online':
				return 'bg-chart-2';
			case 'away':
				return 'bg-yellow-500';
			case 'dnd':
				return 'bg-destructive';
			default:
				return 'bg-muted-foreground';
		}
	};

	const getStatusText = (status?: string) => {
		switch (status) {
			case 'online':
				return 'Online';
			case 'away':
				return 'Away';
			case 'dnd':
				return 'Do Not Disturb';
			default:
				return 'Offline';
		}
	};

	// Get placement styles
	const placementStyles = {
		top: 'bottom-full mb-2',
		bottom: 'top-full mt-2',
		left: 'right-full mr-2',
		right: 'left-full ml-2',
	};

	return (
		<>
			<Button
				variant="ghost"
				className="fixed inset-0 z-[999] bg-transparent border-none cursor-default h-auto w-auto rounded-none p-0 hover:bg-transparent"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onClose();
					}
				}}
				tabIndex={-1}
				aria-label="Close popover"
			/>
			<div
				data-user-popover
				className={cn(
					'fixed z-[9999] bg-popover rounded-lg shadow-xl border min-w-[300px] max-w-[350px] overflow-hidden',
					'animate-in fade-in-0 zoom-in-95 duration-150',
					placementStyles[placement],
				)}
				style={{
					position: 'fixed',
					top: position.top,
					left: position.left,
				}}
			>
				{/* Header */}
				<div className="relative bg-gradient-to-br from-primary to-primary p-4 text-primary-foreground">
					{/* User Info */}
					<div className="flex items-center gap-3 mb-3">
						<Avatar size="64px" paymail={user.paymail} icon={user.logo} />
						<div className="flex-1 min-w-0">
							<div className="text-lg font-bold break-words mb-0.5">
								{user.alternateName || user.name || user.paymail?.split('@')[0] || 'Anonymous'}
							</div>
							<div className="text-sm font-medium opacity-80">@{user.paymail}</div>
						</div>
					</div>

					{/* Status */}
					<div className="flex items-center gap-2">
						<div
							className={cn(
								'w-3 h-3 rounded-full border-2 border-primary-foreground',
								getStatusColor(user.status || 'offline'),
							)}
						/>
						<div className="text-xs font-medium opacity-90">{getStatusText(user.status)}</div>
					</div>

					{user.customStatus && (
						<div className="text-xs italic opacity-70 mt-1">"{user.customStatus}"</div>
					)}
				</div>

				{/* Body */}
				<div className="p-4">
					{/* Member Since */}
					<div className="mb-4">
						<div className="text-xs font-bold text-muted-foreground uppercase mb-1">
							Member Since
						</div>
						<div className="text-sm break-words">
							{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}
						</div>
					</div>

					{/* Roles */}
					{user.roles && user.roles.length > 0 && (
						<div className="mb-4">
							<div className="text-xs font-bold text-muted-foreground uppercase mb-1">Roles</div>
							<div className="flex flex-wrap gap-1">
								{user.roles.map((role) => (
									<span
										key={role}
										className="inline-block bg-primary text-primary-foreground text-[11px] font-semibold px-1.5 py-0.5 rounded"
									>
										{role}
									</span>
								))}
							</div>
						</div>
					)}

					<Separator className="my-3" />

					{/* Actions */}
					{!isOwnProfile && isAuthenticated && (
						<div className="flex gap-2 mb-4">
							<Button
								variant="default"
								size="sm"
								onClick={handleSendMessage}
								disabled={actionLoading === 'message'}
								title="Send Direct Message"
								className="flex-1"
							>
								{actionLoading === 'message' ? '...' : 'Message'}
							</Button>

							<Button
								variant="secondary"
								size="sm"
								onClick={handleAddFriend}
								disabled={actionLoading === 'friend'}
								title="Send Friend Request"
								className="flex-1"
							>
								{actionLoading === 'friend' ? '...' : 'Add Friend'}
							</Button>
						</div>
					)}

					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleViewProfile}
							title="View Full Profile"
							className="w-full"
						>
							View Profile
						</Button>
					</div>
				</div>
			</div>
		</>
	);
};
