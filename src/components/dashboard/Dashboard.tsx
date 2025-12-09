import type { FC } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import ChatArea from './ChatArea';
import { Friends } from './Friends';
import Header from './Header';
import { MemberList } from './MemberList';
import Sidebar from './Sidebar';
import { SettingsModal } from './modals/SettingsModal';

interface DashboardProps {
	isFriendsPage: boolean;
}

const Container = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--background);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100vh;
  background-color: var(--background);
`;

export const Dashboard: FC<DashboardProps> = ({ isFriendsPage }) => {
	const params = useParams<{ user?: string; channel?: string }>();
	const isUserPage = Boolean(params.user);

	const renderMainContent = () => {
		if (isFriendsPage) {
			return <Friends />;
		}

		if (isUserPage) {
			// For now, redirect to chat area since UserProfile doesn't exist
			return <ChatArea />;
		}

		return <ChatArea />;
	};

	return (
		<Container>
			<Sidebar />
			<ContentWrapper>
				<Header isFriendsPage={isFriendsPage} />
				{renderMainContent()}
			</ContentWrapper>
			<MemberList />
			<SettingsModal />
		</Container>
	);
};
