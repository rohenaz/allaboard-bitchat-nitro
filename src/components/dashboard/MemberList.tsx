import { type FC } from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadFriends, loadUsers } from '../../reducers/memberListReducer';
import type { AppDispatch, RootState } from '../../store';
import { UserList } from './UserList';

export const MemberList: FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();

  const memberList = useSelector((state: RootState) => state.memberList);
  const chat = useSelector((state: RootState) => state.chat);
  const isOpen = memberList.isOpen;
  const activeChannel = params.channel;

  // Filter users based on active channel
  const filteredUsers = memberList.allIds
    .map((id) => {
      const user = memberList.byId[id];
      console.log('Filtering user:', { id, user, activeChannel });
      if (!user?.idKey) return null;

      // If no active channel, show all users
      if (!activeChannel) return user;

      // Check if user has sent messages in this channel
      const hasMessagesInChannel = chat.messages.data.some((msg) => {
        const msgBapId = msg.MAP?.[0]?.bapID;
        if (msgBapId === user.idKey) {
          console.log('Message BAP ID:', { msg });
        }
        return msgBapId === user.idKey;
      });
      console.log('User message check:', { 
        user: user.paymail, 
        idKey: user.idKey,
        hasMessages: hasMessagesInChannel,
        messageCount: chat.messages.data.length
      });

      return hasMessagesInChannel ? user : null;
    })
    .filter((user): user is NonNullable<typeof user> => user !== null)
    .map((user) => ({
      _id: user.idKey,
      paymail: user.displayName || user.paymail || user.idKey,
      logo: user.icon || user.logo || '',
      alternateName: user.displayName || user.paymail || user.idKey,
    }));

  const fetchMemberList = useCallback(() => {
    console.log('MemberList auth state:', { authToken, connected, hasUsers: memberList.allIds.length > 0, activeChannel });
    if ((authToken || connected) && !memberList.allIds.length) {
      if (activeChannel) {
        console.log('Dispatching loadUsers() for channel');
        void dispatch(loadUsers());
      } else {
        console.log('Dispatching loadFriends() for friends view');
        void dispatch(loadFriends());
      }
    }
  }, [authToken, connected, dispatch, memberList.allIds.length, activeChannel]);

  useEffect(() => {
    fetchMemberList();
  }, [fetchMemberList]);

  console.log('MemberList state:', { 
    loading: memberList.loading,
    userCount: memberList.allIds.length,
    filteredCount: filteredUsers.length,
    isOpen,
    activeChannel,
    users: memberList.byId
  });

  if (!isOpen) {
    console.log('MemberList is not open, returning null');
    return null;
  }

  return (
    <div className="w-60 min-w-60 bg-base-200 flex flex-col overflow-hidden relative shrink-0">
      <UserList
        users={filteredUsers}
        loading={memberList.loading}
        title={activeChannel ? `#${activeChannel} Members` : 'Friends'}
        showFriendRequests={!activeChannel}
      />
    </div>
  );
};
