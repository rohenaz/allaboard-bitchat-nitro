import type React from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadChannels } from '../../reducers/channelsReducer';
import { loadFriends } from '../../reducers/memberListReducer';
import type { AppDispatch } from '../../store';
import { FetchStatus } from '../../utils/common';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardProps {
  isFriendsPage: boolean;
}

interface RootState {
  session: {
    user?: {
      idKey?: string;
    };
  };
}

const Dashboard: React.FC<DashboardProps> = ({ isFriendsPage }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const user = useSelector((state: RootState) => state.session.user);

  useEffect(() => {
    const loadData = async () => {
      if (user?.idKey) {
        await dispatch(loadFriends());
        await dispatch(loadChannels());
      }
    };
    loadData();
  }, [dispatch, user]);

  if (!user?.idKey) {
    return <div>Please log in to continue.</div>;
  }

  if (authToken === FetchStatus.LOADING || connected === FetchStatus.LOADING) {
    return <div>Loading wallet...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar>
        <Header isFriendsPage={isFriendsPage} />
      </Sidebar>
      <div className="flex-1 flex flex-col">{/* Main content */}</div>
    </div>
  );
};

export default Dashboard;
