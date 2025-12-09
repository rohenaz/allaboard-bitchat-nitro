import { Loader2, MessageSquare, Search, UserPlus } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { api } from '../../api/fetch';
import type { User } from '../../api/user';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadFriends } from '../../reducers/memberListReducer';
import type { AppDispatch, RootState } from '../../store';
import Avatar from './Avatar';

interface UserSearchProps {
	onUserSelect?: (user: User) => void;
	placeholder?: string;
	showActions?: boolean;
}

export const UserSearch: FC<UserSearchProps> = ({
	onUserSelect,
	placeholder = 'Search users...',
	showActions = true,
}) => {
	const { authToken } = useHandcash();
	const { connected } = useYours();
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const session = useSelector((state: RootState) => state.session);

	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const isAuthenticated = authToken || connected;

	const searchUsers = useCallback(
		async (searchQuery: string) => {
			if (!searchQuery.trim() || !isAuthenticated) return;

			try {
				setLoading(true);
				const params: Record<string, string> = {};
				if (searchQuery.includes('@')) {
					params.paymail = searchQuery;
				} else {
					params.username = searchQuery;
				}

				const users = await api.get<User[]>('/users', { params });

				// Filter out current user
				const filteredUsers = users.filter((user) => user.paymail !== session.user?.paymail);

				setResults(filteredUsers);
			} catch (error) {
				console.error('Failed to search users:', error);
				setResults([]);
			} finally {
				setLoading(false);
			}
		},
		[isAuthenticated, session.user?.paymail],
	);

	const handleSendFriendRequest = useCallback(
		async (e: React.MouseEvent, user: User) => {
			e.stopPropagation();
			if (!session.user?.idKey || !user.idKey) return;

			try {
				setActionLoading(`friend-${user.id}`);
				await api.post('/friend-requests', {
					from: session.user.idKey,
					to: user.idKey,
				});
				await dispatch(loadFriends());
			} catch (error) {
				console.error('Failed to send friend request:', error);
			} finally {
				setActionLoading(null);
			}
		},
		[session.user?.idKey, dispatch],
	);

	const handleMessage = useCallback(
		async (e: React.MouseEvent, user: User) => {
			e.stopPropagation();
			if (!session.user?.idKey || !user.idKey) return;

			try {
				setActionLoading(`message-${user.id}`);
				const channel = await api.post<{ id: string }>('/channels', {
					type: 'dm',
					members: [session.user.idKey, user.idKey],
				});
				navigate(`/channels/${channel.id}`);
				setOpen(false);
				setQuery('');
			} catch (error) {
				console.error('Failed to create DM:', error);
			} finally {
				setActionLoading(null);
			}
		},
		[session.user?.idKey, navigate],
	);

	const handleUserSelect = useCallback(
		(user: User) => {
			if (onUserSelect) {
				onUserSelect(user);
			} else if (user.paymail) {
				navigate(`/@/${user.paymail}`);
			}
			setOpen(false);
			setQuery('');
		},
		[onUserSelect, navigate],
	);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (query.length >= 2) {
				searchUsers(query);
			} else {
				setResults([]);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [query, searchUsers]);

	// Keyboard shortcut to open search
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};
		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
	}, []);

	return (
		<>
			<Button
				variant="outline"
				onClick={() => setOpen(true)}
				className="relative h-9 w-full max-w-[400px] justify-start rounded-md bg-muted/50 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:pr-12"
			>
				<Search className="mr-2 h-4 w-4" />
				<span className="hidden lg:inline-flex">{placeholder}</span>
				<span className="inline-flex lg:hidden">Search...</span>
				<kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="overflow-hidden p-0 sm:max-w-[500px]">
					<DialogTitle className="sr-only">Search users</DialogTitle>
					<Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
						<CommandInput
							placeholder={placeholder}
							value={query}
							onValueChange={setQuery}
						/>
						<CommandList className="max-h-[400px]">
							{loading && (
								<div className="flex items-center justify-center py-6">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							)}

							{!loading && query.length >= 2 && results.length === 0 && (
								<CommandEmpty>No users found.</CommandEmpty>
							)}

							{!loading && query.length < 2 && (
								<div className="py-6 text-center text-sm text-muted-foreground">
									Type at least 2 characters to search
								</div>
							)}

							{!loading && results.length > 0 && (
								<CommandGroup heading="Users">
									{results.map((user) => (
										<CommandItem
											key={user.id}
											value={user.paymail || user.id}
											onSelect={() => handleUserSelect(user)}
											className="flex items-center gap-3 px-3 py-2"
										>
											<Avatar size="36px" paymail={user.paymail} icon={user.avatar} />
											<div className="flex flex-1 flex-col min-w-0">
												<span className="font-medium truncate">
													{user.name || user.paymail?.split('@')[0] || 'Anonymous'}
												</span>
												<span className="text-xs text-muted-foreground truncate">
													@{user.paymail}
												</span>
											</div>

											{showActions && isAuthenticated && (
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={(e) => handleMessage(e, user)}
														disabled={actionLoading === `message-${user.id}`}
														title="Send message"
													>
														{actionLoading === `message-${user.id}` ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<MessageSquare className="h-4 w-4" />
														)}
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={(e) => handleSendFriendRequest(e, user)}
														disabled={actionLoading === `friend-${user.id}`}
														title="Add friend"
													>
														{actionLoading === `friend-${user.id}` ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<UserPlus className="h-4 w-4" />
														)}
													</Button>
												</div>
											)}
										</CommandItem>
									))}
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</DialogContent>
			</Dialog>
		</>
	);
};
