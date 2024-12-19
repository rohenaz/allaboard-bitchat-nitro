import { Popover } from '@mui/material';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useActiveUser } from '../../hooks';
import Avatar from './Avatar';

interface RootState {
  session: {
    user?: {
      bapId?: string;
    };
  };
}

interface UserPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  paymail?: string;
  logo?: string;
  alternateName?: string;
  bapId?: string;
}

const Container = styled.div`
  background-color: var(--background-floating);
  border-radius: 8px;
  padding: 1rem;
  width: 340px;
  display: flex;
  flex-direction: column;
`;

const Banner = styled.div`
  background-color: var(--background-secondary);
  height: 60px;
  margin: -1rem -1rem 0;
  border-radius: 8px 8px 0 0;
`;

const AvatarWrapper = styled.div`
  margin-top: -30px;
  margin-left: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
`;

const Username = styled.div`
  color: var(--header-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin-left: 1rem;
  margin-bottom: 1rem;
`;

const Section = styled.div`
  margin-bottom: 1rem;
`;

const SectionTitle = styled.div`
  color: var(--header-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
`;

const SectionContent = styled.div`
  color: var(--text-normal);
  font-size: 0.875rem;
`;

const Button = styled.button`
  background-color: var(--button-secondary-background);
  color: var(--text-normal);
  border: none;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--button-secondary-background-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UserPopover: React.FC<UserPopoverProps> = ({
  open,
  onClose,
  anchorEl,
  paymail,
  logo,
  alternateName,
  bapId,
}) => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const navigate = useNavigate();
  const _activeUser = useActiveUser();

  const session = useSelector((state: RootState) => state.session);

  const guest = useMemo(() => {
    return !authToken && !connected;
  }, [authToken, connected]);

  const self = useMemo(() => {
    return bapId === session.user?.bapId;
  }, [bapId, session.user?.bapId]);

  const handleClick = useCallback(() => {
    if (self) {
      return;
    }
    navigate(`/channels/@me/${bapId}`);
    onClose();
  }, [navigate, onClose, self, bapId]);

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Container>
        <Banner />
        <AvatarWrapper onClick={handleClick}>
          <Avatar size="80px" bgcolor={'#000'} paymail={paymail} icon={logo} />
        </AvatarWrapper>
        <Username>{alternateName || paymail}</Username>
        <Section>
          <SectionTitle>About Me</SectionTitle>
          <SectionContent>
            {guest
              ? 'Please connect your wallet to chat'
              : self
                ? "You can't message yourself"
                : 'Message'}
          </SectionContent>
        </Section>
        {!guest && !self && <Button onClick={handleClick}>Send Message</Button>}
      </Container>
    </Popover>
  );
};

export default UserPopover;
