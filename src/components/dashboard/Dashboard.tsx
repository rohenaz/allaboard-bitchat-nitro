import type React from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadFriends } from '../../reducers/memberListReducer';
import { FetchStatus } from '../../utils/common';
import ChannelList from './ChannelList';
import Header from './Header';
import MemberList from './MemberList';
import ServerList from './ServerList';
import Sidebar from './Sidebar';

interface RootState {
  memberList: {
    friendRequests: {
      loading: boolean;
      data: Array<{
        _id: string;
        paymail: string;
        logo?: string;
        alternateName?: string;
      }>;
    };
  };
  session: {
    user?: {
      bapId?: string;
    };
  };
}

const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
`;

const Dashboard: React.FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const friendRequests = useSelector(
    (state: RootState) => state.memberList.friendRequests,
  );

  useEffect(() => {
    if (authToken || connected) {
      dispatch(loadFriends());
    }
  }, [authToken, connected, dispatch]);

  useEffect(() => {
    if (friendRequests.loading === FetchStatus.Success && !params.user) {
      const firstFriend = friendRequests.data?.[0];
      if (firstFriend) {
        navigate(`/channels/@me/${firstFriend._id}`);
      }
    }
  }, [friendRequests.loading, friendRequests.data, navigate, params.user]);

  return (
    <Container>
      <ServerList />
      <Sidebar>
        <Header />
        <ChannelList />
      </Sidebar>
      <Content>
        <Outlet />
        <MemberList />
      </Content>
    </Container>
  );
};

export default Dashboard;
