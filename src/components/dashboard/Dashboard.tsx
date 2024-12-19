import type React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadFriends } from '../../reducers/memberListReducer';
import type { AppDispatch } from '../../store';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardProps {
  isFriendsPage: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isFriendsPage }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const loadData = async () => {
      await dispatch(loadFriends());
    };
    loadData();
  }, [dispatch]);

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
