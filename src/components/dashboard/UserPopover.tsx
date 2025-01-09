import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/fetch';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadFriends } from '../../reducers/memberListReducer';
import type { AppDispatch, RootState } from '../../store';
import Avatar from './Avatar';

interface User {
  _id: string;
  paymail: string;
  logo?: string;
  alternateName?: string;
}

interface Channel {
  id: string;
  name: string;
  members: string[];
}

interface UserPopoverProps {
  paymail: string;
  logo?: string;
  onClose: () => void;
}

export const UserPopover: FC<UserPopoverProps> = ({ paymail, logo, onClose }) => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const session = useSelector((state: RootState) => state.session);

  const fetchUser = useCallback(async () => {
    if (!paymail) return;

    try {
      setLoading(true);
      const users = await api.get<User[]>('/users', {
        params: { paymail },
      });
      const targetUser = users.find((u) => u.paymail === paymail);
      setUser(targetUser || null);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  }, [paymail]);

  const handleAddFriend = useCallback(async () => {
    if (!user?._id || !session.user?.idKey) return;

    try {
      await api.post('/friend-requests', {
        from: session.user.idKey,
        to: user._id,
      });
      await dispatch(loadFriends());
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  }, [user?._id, session.user?.idKey, dispatch]);

  const handleStartChat = useCallback(async () => {
    if (!user?._id || !session.user?.idKey) return;

    try {
      const channel = await api.post<Channel>('/channels', {
        type: 'dm',
        members: [session.user.idKey, user._id],
      });
      navigate(`/channels/${channel.id}`);
    } catch (error) {
      console.error('Failed to create DM channel:', error);
    }
  }, [user?._id, session.user?.idKey, navigate]);

  useEffect(() => {
    if (authToken || connected) {
      void fetchUser();
    }
  }, [authToken, connected, fetchUser]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-base-300/50 flex items-center justify-center z-9999">
        <div className="bg-base-100 p-8 rounded-2xl text-base-content/60">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-base-300/50 flex items-center justify-center z-9999">
        <div className="bg-base-100 p-8 rounded-2xl text-base-content/60">
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-base-300/50 flex items-center justify-center z-9999" onClick={onClose}>
      <div className="bg-base-100 p-8 rounded-2xl text-base-content/60" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-4">
          <Avatar
            size="80px"
            paymail={paymail}
            icon={logo}
          />
          <div className="text-lg font-bold text-base-content">{paymail}</div>
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleStartChat}
            >
              Message
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleAddFriend}
            >
              Add Friend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
