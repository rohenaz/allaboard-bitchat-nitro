import type React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { toggleProfile } from '../../reducers/profileReducer';
import type { RootState } from '../../types';
import Avatar from './Avatar';

const Container = styled.div<{ isOpen: boolean }>`
  position: fixed;
  bottom: 0;
  left: 72px;
  width: 240px;
  height: 100vh;
  background-color: var(--background-secondary);
  transform: translateX(${({ isOpen }) => (isOpen ? '0' : '-100%')});
  transition: transform 0.2s ease;
  z-index: 100;
  border-right: 1px solid var(--background-tertiary);
`;

const Header = styled.div`
  padding: 20px;
  background-color: var(--background-secondary-alt);
  border-bottom: 1px solid var(--background-tertiary);
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const Username = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: var(--header-primary);
  text-align: center;
`;

const Status = styled.div`
  font-size: 14px;
  color: var(--text-muted);
`;

const Section = styled.div`
  padding: 20px;
  border-bottom: 1px solid var(--background-tertiary);
`;

const SectionTitle = styled.h3`
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--header-secondary);
  margin-bottom: 8px;
`;

const ProfilePanel: React.FC = () => {
  const dispatch = useDispatch();
  const session = useSelector((state: RootState) => state.session);
  const isOpen = useSelector((state: RootState) => state.profile.isOpen);

  if (!session.user) {
    return null;
  }

  return (
    <Container isOpen={isOpen}>
      <Header>
        <UserInfo>
          <Avatar
            size="80px"
            paymail={session.user.paymail}
            icon={session.user.icon || ''}
          />
          <div>
            <Username>{session.user.paymail}</Username>
            <Status>Online</Status>
          </div>
        </UserInfo>
      </Header>
      <Section>
        <SectionTitle>Wallet</SectionTitle>
        <div>{session.user.wallet}</div>
      </Section>
      {session.user.address && (
        <Section>
          <SectionTitle>Address</SectionTitle>
          <div style={{ wordBreak: 'break-all' }}>{session.user.address}</div>
        </Section>
      )}
    </Container>
  );
};

export default ProfilePanel;
