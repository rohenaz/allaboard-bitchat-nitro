import type React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../types';
import Avatar from './Avatar';

interface HeaderProps {
  isFriendsPage: boolean;
}

const Header: React.FC<HeaderProps> = ({ isFriendsPage }) => {
  const session = useSelector((state: RootState) => state.session);

  return (
    <div className="flex items-center p-4 border-b border-gray-200">
      {isFriendsPage ? (
        <h1 className="text-xl font-semibold">Friends</h1>
      ) : (
        <h1 className="text-xl font-semibold">Channels</h1>
      )}
      {session.user && (
        <div className="ml-auto">
          <Avatar
            icon={session.user.icon || ''}
            paymail={session.user.paymail}
            size="32px"
          />
        </div>
      )}
    </div>
  );
};

export default Header;
