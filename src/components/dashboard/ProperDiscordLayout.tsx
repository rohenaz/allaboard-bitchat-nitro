import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
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

interface ProperDiscordLayoutProps {
	isFriendsPage: boolean;
}

export const ProperDiscordLayout: FC<ProperDiscordLayoutProps> = ({ isFriendsPage }) => {
	const params = useParams<{ user?: string; channel?: string }>();
	const isUserPage = Boolean(params.user);
	const isMemberListOpen = useSelector((state: RootState) => state.memberList.isOpen);

	const renderMainContent = () => {
		if (isFriendsPage) {
			return <Friends />;
		}
		return <ChatArea />;
	};

	return (
		<div className="flex h-screen w-full bg-background overflow-hidden">
			{/* Discord Layout Structure:
			    - Server List: 72px (fixed)
			    - Channel Sidebar: 240px (fixed)
			    - Main Content: flex-1
			    - Member List: 240px (toggleable)
			*/}

			{/* Server List - 72px fixed */}
			<div className="w-[72px] flex-shrink-0 bg-[#1e1f22] flex">
				<ServerList />
			</div>

			{/* Channel Sidebar - 240px fixed */}
			<div className="w-[240px] flex-shrink-0 bg-[#2b2d31] flex flex-col">
				{/* Server Header */}
				<div className="h-12 px-4 flex items-center shadow-sm border-b border-[#1e1f22]">
					<h2 className="text-[15px] font-semibold text-white">BitChat Nitro</h2>
				</div>

				{/* Channel List / User List */}
				<div className="flex-1 overflow-hidden">
					{isUserPage ? <UserList activeUserId={params.user} /> : <ChannelList />}
				</div>

				{/* User Panel */}
				<UserPanel />
			</div>

			{/* Main Area */}
			<div className="flex-1 flex flex-col bg-[#313338]">
				{/* Header */}
				<Header isFriendsPage={isFriendsPage} />

				{/* Content Area */}
				<div className="flex-1 flex overflow-hidden">
					{/* Chat/Friends Area */}
					<div className="flex-1 flex flex-col overflow-hidden">{renderMainContent()}</div>

					{/* Member List - 240px (toggleable) */}
					{!isUserPage && !isFriendsPage && (
						<div
							className={cn(
								'w-[240px] bg-[#2b2d31] flex-shrink-0 transition-all duration-200',
								!isMemberListOpen && 'w-0 overflow-hidden',
							)}
						>
							<MemberList />
						</div>
					)}
				</div>
			</div>

			{/* Modals */}
			<SettingsModal />
		</div>
	);
};
