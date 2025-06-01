import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { api } from '../../api/fetch';
import type { User } from '../../api/user';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadFriends } from '../../reducers/memberListReducer';
import type { AppDispatch, RootState } from '../../store';
import Avatar from './Avatar';

const Container = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1px solid var(--background-modifier-accent);
  border-radius: 8px;
  background-color: var(--background-secondary);
  color: var(--text-normal);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: var(--brand-experiment);
    box-shadow: 0 0 0 2px rgba(var(--brand-experiment-rgb), 0.2);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 16px;
`;

const ResultsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--background-floating);
  border: 1px solid var(--background-modifier-accent);
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
`;

const ResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--background-modifier-hover);
  }

  &:not(:last-child) {
    border-bottom: 1px solid var(--background-modifier-accent);
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-normal);
  margin-bottom: 2px;
`;

const UserPaymail = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ $variant = 'secondary' }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: var(--brand-experiment);
          color: var(--white);
          &:hover {
            background-color: var(--brand-experiment-darker);
          }
        `;
      default:
        return `
          background-color: var(--background-secondary);
          color: var(--text-normal);
          border: 1px solid var(--background-modifier-accent);
          &:hover {
            background-color: var(--background-modifier-hover);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingText = styled.div`
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
`;

const NoResults = styled.div`
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
`;

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  placeholder?: string;
  showActions?: boolean;
}

export const UserSearch: FC<UserSearchProps> = ({
  onUserSelect,
  placeholder = 'Search users...',
  showActions = true,
}) => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const session = useSelector((state: RootState) => state.session);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAuthenticated = authToken || connected;

  const searchUsers = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || !isAuthenticated) return;

      try {
        setLoading(true);
        const params: Record<string, string> = {};
        if (searchQuery.includes('@')) {
          params.paymail = searchQuery;
        } else {
          params.username = searchQuery;
        }

        const users = await api.get<User[]>('/users', { params });

        // Filter out current user
        const filteredUsers = users.filter(
          (user) => user.paymail !== session.user?.paymail,
        );

        setResults(filteredUsers);
      } catch (error) {
        console.error('Failed to search users:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, session.user?.paymail],
  );

  const handleSendFriendRequest = useCallback(
    async (user: User) => {
      if (!session.user?.idKey || !user.idKey) return;

      try {
        setActionLoading(`friend-${user.id}`);
        await api.post('/friend-requests', {
          from: session.user.idKey,
          to: user.idKey,
        });
        await dispatch(loadFriends());
      } catch (error) {
        console.error('Failed to send friend request:', error);
      } finally {
        setActionLoading(null);
      }
    },
    [session.user?.idKey, dispatch],
  );

  const handleMessage = useCallback(
    async (user: User) => {
      if (!session.user?.idKey || !user.idKey) return;

      try {
        setActionLoading(`message-${user.id}`);
        const channel = await api.post<{ id: string }>('/channels', {
          type: 'dm',
          members: [session.user.idKey, user.idKey],
        });
        navigate(`/channels/${channel.id}`);
        setShowResults(false);
        setQuery('');
      } catch (error) {
        console.error('Failed to create DM:', error);
      } finally {
        setActionLoading(null);
      }
    },
    [session.user?.idKey, navigate],
  );

  const handleUserClick = useCallback(
    (user: User) => {
      if (onUserSelect) {
        onUserSelect(user);
      } else if (user.paymail) {
        navigate(`/@/${user.paymail}`);
      }
      setShowResults(false);
      setQuery('');
    },
    [onUserSelect, navigate],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        searchUsers(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-user-search]')) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Container data-user-search>
      <SearchIcon>🔍</SearchIcon>
      <SearchInput
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => query.length >= 2 && setShowResults(true)}
      />

      {showResults && query.length >= 2 && (
        <ResultsContainer>
          {loading ? (
            <LoadingText>Searching...</LoadingText>
          ) : results.length === 0 ? (
            <NoResults>No users found</NoResults>
          ) : (
            results.map((user) => (
              <ResultItem key={user.id}>
                <Avatar size="36px" paymail={user.paymail} icon={user.avatar} />
                <UserInfo onClick={() => handleUserClick(user)}>
                  <UserName>
                    {user.name || user.paymail?.split('@')[0] || 'Anonymous'}
                  </UserName>
                  <UserPaymail>@{user.paymail}</UserPaymail>
                </UserInfo>

                {showActions && isAuthenticated && (
                  <>
                    <ActionButton
                      $variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessage(user);
                      }}
                      disabled={actionLoading === `message-${user.id}`}
                    >
                      {actionLoading === `message-${user.id}`
                        ? '...'
                        : 'Message'}
                    </ActionButton>
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendFriendRequest(user);
                      }}
                      disabled={actionLoading === `friend-${user.id}`}
                    >
                      {actionLoading === `friend-${user.id}`
                        ? '...'
                        : 'Add Friend'}
                    </ActionButton>
                  </>
                )}
              </ResultItem>
            ))
          )}
        </ResultsContainer>
      )}
    </Container>
  );
};
