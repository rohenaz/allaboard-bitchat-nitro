import type { FC } from 'react';
import { useParams } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import ChatArea from './ChatArea';
import { Friends } from './Friends';
import Header from './Header';
import { MemberList } from './MemberList';
import { SettingsModal } from './modals/SettingsModal';
import Sidebar from './Sidebar';

interface DashboardProps {
	isFriendsPage: boolean;
}

export const Dashboard: FC<DashboardProps> = ({ isFriendsPage }) => {
	const params = useParams<{ user?: string; channel?: string }>();
	const isUserPage = Boolean(params.user);

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
		<SidebarProvider>
			<div className="flex h-screen w-screen overflow-hidden bg-background">
				<Sidebar />
				<SidebarInset>
					<div className="flex h-full">
						<div className="flex flex-col flex-1 min-h-0 h-full bg-background">
							<Header isFriendsPage={isFriendsPage} />
							{renderMainContent()}
						</div>
						<MemberList />
					</div>
				</SidebarInset>
				<SettingsModal />
			</div>
		</SidebarProvider>
	);
};
