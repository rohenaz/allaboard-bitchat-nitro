import { Users } from 'lucide-react';
import type { FC } from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarProvider,
} from '@/components/ui/sidebar';
import { loadFriends, loadUsers } from '../../reducers/memberListReducer';
import type { AppDispatch, RootState } from '../../store';
import { UserList } from './UserList';

export const MemberList: FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const params = useParams();

	const memberList = useSelector((state: RootState) => state.memberList);
	const session = useSelector((state: RootState) => state.session);
	const chat = useSelector((state: RootState) => state.chat);
	const isOpen = memberList.isOpen;
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

	if (!isOpen) {
		return null;
	}

	return (
		<SidebarProvider
			defaultOpen={isOpen}
			style={{ '--sidebar-width': '240px' } as React.CSSProperties}
		>
			<Sidebar side="right" collapsible="none" className="border-l border-border hidden md:flex">
				<SidebarHeader className="p-4 border-b border-border">
					<div className="flex items-center gap-2 text-sm font-semibold">
						<Users className="h-4 w-4" />
						{activeChannel ? `#${activeChannel}` : 'Friends'}
					</div>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>
							{activeChannel ? 'Members' : 'Online'} — {filteredUsers.length}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<UserList
								users={filteredUsers}
								loading={memberList.loading && session.isAuthenticated}
								showFriendRequests={!activeChannel && !!session.user?.idKey}
							/>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
		</SidebarProvider>
	);
};
