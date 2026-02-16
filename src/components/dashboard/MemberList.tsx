import { Users } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { loadFriends, loadUsers } from '../../reducers/memberListReducer';
import type { AppDispatch, RootState } from '../../store';
import { UserList } from './UserList';

export const MemberList: FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const params = useParams();

	const memberList = useSelector((state: RootState) => state.memberList);
	const session = useSelector((state: RootState) => state.session);
	const chat = useSelector((state: RootState) => state.chat);
	const activeChannel = params.channel;

	// Filter users based on active channel
	const filteredUsers = memberList.allIds
		.map((id) => {
			const user = memberList.byId[id];
			if (!user?.idKey) return null;

			// If no active channel, show all users
			if (!activeChannel) return user;

			// Check if user has sent messages in this channel
			const hasMessagesInChannel = chat.messages.data.some((msg) => {
				const senderAddress = msg.AIP?.[0]?.address;
				return senderAddress && user.currentAddress === senderAddress;
			});

			return hasMessagesInChannel ? user : null;
		})
		.filter((user): user is NonNullable<typeof user> => user !== null)
		.map((user) => ({
			id: user.idKey,
			name: user.displayName || user.paymail || user.idKey,
			avatar: user.icon || user.logo || '',
			paymail: user.paymail || undefined,
			bapId: user.idKey,
			idKey: user.idKey,
			status: 'online' as const,
		}));

	const fetchMemberList = useCallback(() => {
		// Use session.isAuthenticated (includes guests) and require idKey for friends
		const hasIdentity = session.isAuthenticated && session.user?.idKey;

		if (!memberList.allIds.length && !memberList.loading) {
			if (activeChannel && session.isAuthenticated) {
				// Load channel members for authenticated users (including guests)
				void dispatch(loadUsers());
			} else if (hasIdentity) {
				// Only load friends if user has a BAP identity
				void dispatch(loadFriends());
			}
		}
	}, [
		session.isAuthenticated,
		session.user?.idKey,
		dispatch,
		memberList.allIds.length,
		memberList.loading,
		activeChannel,
	]);

	useEffect(() => {
		fetchMemberList();
	}, [fetchMemberList]);

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header */}
			<div className="p-4 border-b">
				<div className="flex items-center gap-2 text-sm font-semibold">
					<Users className="h-4 w-4" />
					{activeChannel ? `#${activeChannel}` : 'Friends'}
				</div>
			</div>

			{/* User List */}
			<ScrollArea className="flex-1">
				<div className="p-2">
					<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
						{activeChannel ? 'Members' : 'Online'} — {filteredUsers.length}
					</div>
					<UserList
						users={filteredUsers}
						loading={memberList.loading && session.isAuthenticated}
						showFriendRequests={!activeChannel && !!session.user?.idKey}
					/>
				</div>
			</ScrollArea>
		</div>
	);
};
