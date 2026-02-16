import type { FC } from 'react';
import { useParams } from 'react-router-dom';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
} from '@/components/ui/sidebar';
import ChannelList from './ChannelList';
import ChatArea from './ChatArea';
import { Friends } from './Friends';
import Header from './Header';
import { MemberList } from './MemberList';
import ServerList from './ServerList';
import { UserList } from './UserList';
import UserPanel from './UserPanel';

interface DiscordLayoutProps {
	isFriendsPage: boolean;
}

export const DiscordLayout: FC<DiscordLayoutProps> = ({ isFriendsPage }) => {
	const params = useParams<{ user?: string; channel?: string }>();
	const isUserPage = Boolean(params.user);

	return (
		<SidebarProvider defaultOpen={true} className="flex h-screen w-full">
			{/* Server List - 72px fixed width */}
			<div className="flex h-full w-[72px] flex-shrink-0 flex-col border-r bg-muted">
				<ServerList />
			</div>

			{/* Channel Sidebar - 240px */}
			<Sidebar collapsible="none" className="w-[240px] border-0">
				<SidebarHeader className="h-12 border-b px-4 flex items-center justify-center">
					<h2 className="text-sm font-semibold">BitChat Nitro</h2>
				</SidebarHeader>
				<SidebarContent className="p-0">
					{isUserPage ? <UserList activeUserId={params.user} /> : <ChannelList />}
				</SidebarContent>
				<SidebarFooter className="border-t p-0">
					<UserPanel />
				</SidebarFooter>
			</Sidebar>

			{/* Main Content Area */}
			<SidebarInset className="flex flex-col">
				<Header isFriendsPage={isFriendsPage} />
				<div className="flex flex-1 overflow-hidden">
					{/* Chat Area */}
					<div className="flex-1 overflow-hidden">{isFriendsPage ? <Friends /> : <ChatArea />}</div>

					{/* Member List - 240px */}
					<div className="w-[240px] border-l bg-sidebar">
						<MemberList />
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};
