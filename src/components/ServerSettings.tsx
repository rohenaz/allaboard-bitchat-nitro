import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { getServerById } from '../constants/servers';
import { toggleHideUnverifiedMessages } from '../reducers/settingsReducer';
import type { RootState } from '../store';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background-primary);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--background-modifier-accent);
  box-shadow: var(--elevation-low);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid var(--background-modifier-accent);
  border-radius: 4px;
  color: var(--text-normal);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--background-modifier-hover);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const ServerIcon = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--background-primary);
  padding: 8px;
`;

const ServerInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ServerName = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-normal);
  margin: 0;
`;

const ServerDescription = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 4px 0 0 0;
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const Section = styled.section`
  background-color: var(--background-secondary);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--background-modifier-accent);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-normal);
  margin: 0 0 16px 0;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--background-modifier-accent);
  }
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingLabel = styled.label`
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-normal);
  margin-bottom: 4px;
  cursor: pointer;
`;

const SettingDescription = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
`;

const Toggle = styled.input.attrs({ type: 'checkbox' })`
  position: relative;
  width: 44px;
  height: 24px;
  appearance: none;
  background-color: var(--background-modifier-accent);
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  &:checked {
    background-color: var(--brand-experiment);
  }

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: var(--background);
    border-radius: 50%;
    transition: transform 0.2s ease;
  }

  &:checked::before {
    transform: translateX(20px);
  }

  &:focus {
    outline: 2px solid var(--brand-experiment);
    outline-offset: 2px;
  }
`;

export const ServerSettings: FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { serverId } = useParams<{ serverId: string }>();
	const { hideUnverifiedMessages } = useSelector((state: RootState) => state.settings);

	const server = serverId ? getServerById(serverId) : undefined;

	if (!server) {
		return (
			<Container>
				<Header>
					<BackButton onClick={() => navigate('/channels')}>
						<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Back
					</BackButton>
					<HeaderInfo>
						<ServerName>Server Not Found</ServerName>
					</HeaderInfo>
				</Header>
				<Content>
					<Section>
						<p>The server "{serverId}" could not be found.</p>
					</Section>
				</Content>
			</Container>
		);
	}

	const handleBack = () => {
		navigate('/channels');
	};

	return (
		<Container>
			<Header>
				<BackButton onClick={handleBack}>
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back
				</BackButton>
				<HeaderInfo>
					<ServerIcon src={server.icon} alt={server.name} />
					<ServerInfo>
						<ServerName>{server.name} Settings</ServerName>
						<ServerDescription>{server.description}</ServerDescription>
					</ServerInfo>
				</HeaderInfo>
			</Header>

			<Content>
				<Section>
					<SectionTitle>Messages</SectionTitle>
					<SettingRow>
						<SettingInfo>
							<SettingLabel htmlFor="hide-unverified">Hide unverified messages</SettingLabel>
							<SettingDescription>
								Only show messages that have been verified on the blockchain
							</SettingDescription>
						</SettingInfo>
						<Toggle
							id="hide-unverified"
							checked={hideUnverifiedMessages}
							onChange={() => dispatch(toggleHideUnverifiedMessages())}
						/>
					</SettingRow>
				</Section>

				<Section>
					<SectionTitle>Server Information</SectionTitle>
					<SettingRow>
						<SettingInfo>
							<SettingLabel>Server ID</SettingLabel>
							<SettingDescription>{server._id}</SettingDescription>
						</SettingInfo>
					</SettingRow>
					<SettingRow>
						<SettingInfo>
							<SettingLabel>Type</SettingLabel>
							<SettingDescription>
								{server.isNative ? 'Native Interface' : 'External Server (iframe)'}
							</SettingDescription>
						</SettingInfo>
					</SettingRow>
					{server.paymail && (
						<SettingRow>
							<SettingInfo>
								<SettingLabel>Paymail</SettingLabel>
								<SettingDescription>{server.paymail}</SettingDescription>
							</SettingInfo>
						</SettingRow>
					)}
				</Section>
			</Content>
		</Container>
	);
};
