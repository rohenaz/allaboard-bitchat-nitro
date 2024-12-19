import type React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toggleProfile } from '../../reducers/profileReducer';
import type { RootState } from '../../types';
import Avatar from './Avatar';

const Container = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 52px;
  background-color: var(--background-secondary-alt);
  border-top: 1px solid var(--background-tertiary);
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: var(--background-modifier-hover);
  }
`;

const Username = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--header-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Status = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserPanel: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const session = useSelector((state: RootState) => state.session);

  const handleClick = () => {
    dispatch(toggleProfile());
  };

  if (!session.user) {
    return null;
  }

  return (
    <Container>
      <Avatar
        size="32px"
        paymail={session.user.paymail}
        icon={session.user.icon || ''}
      />
      <UserInfo onClick={handleClick}>
        <Username>{session.user.paymail}</Username>
        <Status>Online</Status>
      </UserInfo>
    </Container>
  );
};

export default UserPanel;
