import type React from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadUsers } from '../../reducers/memberListReducer';
import UserList from './UserList';

interface RootState {
  memberList: {
    loading: boolean;
    data: Array<{
      _id: string;
      paymail: string;
      logo?: string;
      alternateName?: string;
    }>;
  };
}

const Container = styled.div`
  width: 240px;
  min-width: 240px;
  background-color: var(--background-secondary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
`;

const MemberList: React.FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const params = useParams();
  const dispatch = useDispatch();

  const members = useSelector((state: RootState) => state.memberList);

  const fetchMemberList = useCallback(() => {
    if (authToken || connected) {
      dispatch(loadUsers());
    }
  }, [authToken, connected, dispatch]);

  useEffect(() => {
    fetchMemberList();
  }, [fetchMemberList]);

  if (!params.user) {
    return null;
  }

  return (
    <Container>
      <UserList
        users={members.data}
        loading={members.loading}
        title="Members"
        showFriendRequests
      />
    </Container>
  );
};

export default MemberList;
