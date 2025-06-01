import type { FC } from 'react';
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
      if (!user?.idKey) return null;

      // If no active channel, show all users
      if (!activeChannel) return user;

      // Check if user has sent messages in this channel
      const hasMessagesInChannel = chat.messages.data.some((msg) => {
        // Check if this user is the sender (AIP[0].address matches user's currentAddress)
        const senderAddress = msg.AIP?.[0]?.address;
        const isMessageSender =
          senderAddress && user.currentAddress === senderAddress;

        if (senderAddress) {
        }

        return isMessageSender;
      });

      return hasMessagesInChannel ? user : null;
    })
    .filter((user): user is NonNullable<typeof user> => user !== null)
    .map((user) => ({
      id: user.idKey,
      name: user.displayName || user.paymail || user.idKey,
      avatar: user.icon || user.logo || '',
      paymail: user.paymail || undefined,
      bapId: user.idKey,
      idKey: user.idKey,
      status: 'online' as const,
    }));

  const fetchMemberList = useCallback(() => {
    if ((authToken || connected) && !memberList.allIds.length) {
      if (activeChannel) {
        void dispatch(loadUsers());
      } else {
        void dispatch(loadFriends());
      }
    }
  }, [authToken, connected, dispatch, memberList.allIds.length, activeChannel]);

  useEffect(() => {
    fetchMemberList();
  }, [fetchMemberList]);

  if (!isOpen) {
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
