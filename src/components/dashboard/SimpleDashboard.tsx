import { FC } from 'react';
import { useParams } from 'react-router-dom';
import ChannelList from './ChannelList';
import ChatArea from './ChatArea';
import { Friends } from './Friends';
import Header from './Header';
import { MemberList } from './MemberList';
import ServerList from './ServerList';
import { UserList } from './UserList';
import UserPanel from './UserPanel';

interface SimpleDashboardProps {
	isFriendsPage: boolean;
}

export const SimpleDashboard: FC<SimpleDashboardProps> = ({ isFriendsPage }) => {
	const params = useParams<{ user?: string; channel?: string }>();
	const isUserPage = Boolean(params.user);

	return (
		<div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
			{/* Server List - 72px */}
			<div
				style={{
					width: '72px',
					flexShrink: 0,
					backgroundColor: '#202225',
					borderRight: '1px solid #000',
				}}
			>
				<ServerList />
			</div>

			{/* Channel Sidebar - 240px */}
			<div
				style={{
					width: '240px',
					flexShrink: 0,
					backgroundColor: '#2f3136',
					borderRight: '1px solid #202225',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<div
					style={{
						height: '48px',
						borderBottom: '1px solid #202225',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontWeight: 600,
					}}
				>
					BitChat Nitro
				</div>
				<div style={{ flex: 1, overflow: 'auto' }}>
					{params.user ? <UserList activeUserId={params.user} /> : <ChannelList />}
				</div>
				<UserPanel />
			</div>

			{/* Main Content */}
			<div
				style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#36393f' }}
			>
				<Header isFriendsPage={isFriendsPage} />
				<div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
					{/* Chat Area */}
					<div style={{ flex: 1, overflow: 'hidden' }}>
						{isFriendsPage ? <Friends /> : <ChatArea />}
					</div>

					{/* Member List - 240px */}
					<div
						style={{
							width: '240px',
							borderLeft: '1px solid #202225',
							backgroundColor: '#2f3136',
						}}
					>
						<MemberList />
					</div>
				</div>
			</div>
		</div>
	);
};
