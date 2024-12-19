import React, { type FC } from 'react';
import styled from 'styled-components';
import Avatar from './Avatar';

interface User {
  _id: string;
  paymail: string;
  logo?: string;
  alternateName?: string;
}

interface UserListProps {
  activeUserId?: string;
  users?: User[];
  loading?: boolean;
  title?: string;
  showFriendRequests?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background: var(--background-secondary);
  padding: 24px 8px 8px;
  overflow-y: auto;
`;

const Title = styled.h2`
  padding: 0 8px;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: var(--channels-default);
  user-select: none;
`;

const UserItem = styled.div<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: var(--background-modifier-hover);
  }

  ${({ $isActive }) =>
    $isActive &&
    `
    background: var(--background-modifier-selected);
    &:hover {
      background: var(--background-modifier-selected);
    }
  `}
`;

const UserInfo = styled.div`
  margin-left: 12px;
`;

const Username = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: var(--text-normal);
`;

const LoadingText = styled.div`
  padding: 0 8px;
  color: var(--text-muted);
  font-size: 14px;
`;

export const UserList: FC<UserListProps> = ({
  activeUserId,
  users = [],
  loading = false,
  title,
  showFriendRequests = false,
}) => {
  if (loading) {
    return (
      <Container>
        {title && <Title>{title}</Title>}
        <LoadingText>Loading members...</LoadingText>
      </Container>
    );
  }

  return (
    <Container>
      {title && <Title>{title}</Title>}
      {users.map((user) => (
        <UserItem key={user._id} $isActive={user._id === activeUserId}>
          <Avatar size="32px" paymail={user.paymail} icon={user.logo || ''} />
          <UserInfo>
            <Username>{user.alternateName || user.paymail}</Username>
          </UserInfo>
        </UserItem>
      ))}
    </Container>
  );
};
