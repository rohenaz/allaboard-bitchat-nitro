import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api/fetch';
import { loadChannels } from '../../../reducers/channelsReducer';
import type { AppDispatch, RootState } from '../../../store';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface Channel {
  id: string;
  name: string;
  members: string[];
}

const DirectMessageModal = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.session.user);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!currentUser?.idKey) {
      setError('Not logged in');
      return;
    }

    try {
      // Find user by username
      const users = await api.get<User[]>('/users', {
        params: { username },
      });

      const targetUser = users.find((user) => user.name === username);
      if (!targetUser) {
        setError('User not found');
        return;
      }

      // Create DM channel
      const channel = await api.post<Channel>('/channels', {
        type: 'dm',
        members: [currentUser.idKey, targetUser.id],
      });

      await dispatch(loadChannels());
      navigate(`/channels/${channel.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create DM');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-[#111] p-8 rounded-2xl text-[#777]">
        <form onSubmit={handleSubmit} className="p-4">
          <h2 className="text-lg font-bold mb-4">Direct Message</h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={handleInputChange}
            className="bg-[#333] text-[#EEE] w-full p-2 border-0 rounded-lg mb-4"
          />
          <button
            type="submit"
            className="bg-black p-4 text-white flex items-center mx-auto hover:bg-[#222] transition-colors w-full"
          >
            Start Conversation
          </button>
        </form>
      </div>
    </div>
  );
};

export default DirectMessageModal;
