import type { FC } from 'react';
import { useParams } from 'react-router-dom';
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
		<div className="grid grid-cols-[auto_1fr_auto] h-screen w-screen overflow-hidden bg-background md:grid-cols-[auto_1fr_auto]">
			<Sidebar />
			<div className="flex flex-col min-h-0 h-screen bg-background">
				<Header isFriendsPage={isFriendsPage} />
				{renderMainContent()}
			</div>
			<MemberList />
			<SettingsModal />
		</div>
	);
};
