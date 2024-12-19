import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useActiveUser } from '../../hooks';
import Avatar from './Avatar';
import Popover from './Popover';

interface RootState {
  session: {
    user?: {
      idKey?: string;
    };
  };
}

interface UserPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  paymail: string;
  logo?: string;
  alternateName?: string;
  bapId: string;
}

const Container = styled.div`
  width: 300px;
  background-color: var(--background-floating);
  border-radius: 8px;
  overflow: hidden;
`;

const Banner = styled.div`
  height: 60px;
  background-color: var(--background-accent);
`;

const AvatarWrapper = styled.div`
  margin-top: -40px;
  margin-left: 16px;
  margin-bottom: 12px;
  cursor: pointer;
`;

const Username = styled.h3`
  margin: 0;
  padding: 0 16px;
  color: var(--header-primary);
  font-size: 20px;
  font-weight: 600;
  line-height: 24px;
`;

const Section = styled.div`
  margin: 24px 16px 16px;
`;

const SectionTitle = styled.h4`
  margin: 0 0 8px;
  padding: 0;
  color: var(--header-secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
`;

const SectionContent = styled.div`
  color: var(--text-normal);
  font-size: 14px;
  line-height: 18px;
`;

const Button = styled.button`
  margin: 0 16px 16px;
  padding: 2px 16px;
  width: calc(100% - 32px);
  height: 32px;
  background-color: var(--button-secondary-background);
  color: var(--text-normal);
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.17s ease;

  &:hover {
    background-color: var(--button-secondary-background-hover);
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
    return bapId === session.user?.idKey;
  }, [bapId, session.user?.idKey]);

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
