import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { RootState } from '../../store';
import ChannelList from './ChannelList';
import ChatArea from './ChatArea';
import { Friends } from './Friends';
import Header from './Header';
import { MemberList } from './MemberList';
import { SettingsModal } from './modals/SettingsModal';
import ServerList from './ServerList';
import { UserList } from './UserList';
import UserPanel from './UserPanel';

interface DashboardProps {
	isFriendsPage: boolean;
}

export const Dashboard: FC<DashboardProps> = ({ isFriendsPage }) => {
	const params = useParams<{ user?: string; channel?: string }>();
	const isUserPage = Boolean(params.user);
	const isMemberListOpen = useSelector((state: RootState) => state.memberList.isOpen);

	const renderMainContent = () => {
		if (isFriendsPage) {
			return <Friends />;
		}

		if (isUserPage) {
			return <ChatArea />;
		}

		return <ChatArea />;
	};

	return (
		<div
			className="flex h-screen bg-background"
			style={{
				display: 'flex',
				height: '100vh',
				flexDirection: 'row',
			}}
		>
			{/* Server List */}
			<div
				className="flex w-[72px] flex-shrink-0 bg-muted border-r"
				style={{
					display: 'flex',
					width: '72px',
					flexShrink: 0,
					flexDirection: 'column',
				}}
			>
				<ServerList />
			</div>

			{/* Channel/DM Sidebar with Shadcn Provider */}
			<SidebarProvider defaultOpen={true}>
				<Sidebar className="border-r">
					<SidebarHeader className="h-12 flex items-center justify-center border-b">
						<h2 className="text-sm font-semibold">BitChat Nitro</h2>
					</SidebarHeader>
					<SidebarContent className="p-0">
						{params.user ? <UserList activeUserId={params.user} /> : <ChannelList />}
					</SidebarContent>
					<SidebarFooter className="p-0 border-t">
						<UserPanel />
					</SidebarFooter>
				</Sidebar>

				{/* Main Content Area */}
				<SidebarInset className="flex flex-col flex-1 overflow-hidden">
					<Header isFriendsPage={isFriendsPage} />

					<main className="flex flex-1 overflow-hidden">
						{/* Chat Area */}
						<div className="flex-1 overflow-hidden">{renderMainContent()}</div>

						{/* Member List - Toggleable */}
						<div
							className={cn(
								'w-60 border-l bg-background overflow-hidden transition-all duration-200',
								!isMemberListOpen && 'w-0 border-0',
							)}
						>
							<MemberList />
						</div>
					</main>
				</SidebarInset>
			</SidebarProvider>

			{/* Settings Modal */}
			<SettingsModal />
		</div>
	);
};
