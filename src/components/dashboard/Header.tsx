import type React from 'react';
import { FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../reducers/sessionReducer';
import type { RootState } from '../../types';
import ArrowTooltip from './ArrowTooltip';
import Avatar from './Avatar';

interface HeaderProps {
  isFriendsPage: boolean;
}

const Header: React.FC<HeaderProps> = ({ isFriendsPage }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const session = useSelector((state: RootState) => state.session);
  const isAuthenticated = session.isAuthenticated;

  const handleAuthClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      dispatch(logout());
    }
  };

  return (
    <div className="flex items-center p-4 border-b border-gray-200">
      {isFriendsPage ? (
        <h1 className="text-xl font-semibold">Friends</h1>
      ) : (
        <h1 className="text-xl font-semibold">Channels</h1>
      )}
      <div className="ml-auto flex items-center gap-4">
        {session.user && (
          <Avatar
            icon={session.user.icon || ''}
            paymail={session.user.paymail}
            size="32px"
          />
        )}
        <ArrowTooltip title={!isAuthenticated ? 'Login' : 'Logout'}>
          <button
            type="button"
            onClick={handleAuthClick}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
          >
            {!isAuthenticated ? <FaSignInAlt /> : <FaSignOutAlt />}
          </button>
        </ArrowTooltip>
      </div>
    </div>
  );
};

export default Header;
