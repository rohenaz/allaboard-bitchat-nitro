import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { logout } from '../../reducers/sessionReducer';
import { toggleSettings } from '../../reducers/settingsReducer';
import type { RootState } from '../../store';
import Avatar from './Avatar';

interface UserWithLogo {
	paymail?: string;
	wallet?: string;
	authToken?: string;
	bapId?: string;
	idKey?: string;
	address?: string;
	logo?: string;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 52px;
  min-height: 52px;
  background-color: var(--card);
  border-top: 1px solid var(--border);
  position: relative;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: background-color 0.15s ease-out;

  &:hover {
    background-color: var(--accent);
  }
`;

const UserDetails = styled.div`
  margin-left: 8px;
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserStatus = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: var(--muted-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.15s ease-out;

  &:hover {
    background-color: var(--accent);
    color: var(--foreground);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
`;

const UserPanel: FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const user = useSelector((state: RootState) => state.session.user);

	const _handleSignOut = async () => {
		dispatch(logout());
		navigate('/');
	};

	const handleSettingsClick = () => {
		dispatch(toggleSettings());
	};

	return (
		<Container>
			<UserInfo>
				<Avatar size="32px" paymail={user?.paymail} icon={(user as UserWithLogo)?.logo} />
				<UserDetails>
					<UserName>{user?.paymail || 'Guest'}</UserName>
					<UserStatus>
						{user?.wallet === 'sigma'
							? 'Sigma Identity'
							: user?.wallet === 'yours'
								? 'Yours Wallet'
								: user?.wallet === 'handcash'
									? 'HandCash'
									: user?.wallet
										? user.wallet
										: 'Not connected'}
					</UserStatus>
				</UserDetails>
			</UserInfo>

			<ButtonContainer>
				<ActionButton onClick={handleSettingsClick} title="User Settings">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</ActionButton>
			</ButtonContainer>
		</Container>
	);
};

export default UserPanel;
