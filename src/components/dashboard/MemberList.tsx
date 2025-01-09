import React, { type FC } from 'react';
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
      if (!user) return null;

      // If no active channel, show all users
      if (!activeChannel) return user;

      // Check if user has sent messages in this channel
      const hasMessagesInChannel = chat.messages.data.some((msg) => {
        const msgPaymail = msg.MAP?.[0]?.paymail;
        return msgPaymail === user.paymail;
      });

      return hasMessagesInChannel ? user : null;
    })
    .filter((user): user is NonNullable<typeof user> => user !== null)
    .map((user) => ({
      _id: user.idKey,
      paymail: user.paymail,
      logo: user.logo,
      alternateName: user.paymail,
    }));

  const fetchData = useCallback(() => {
    if (authToken || connected) {
      void dispatch(loadUsers());
      if (!activeChannel) {
        void dispatch(loadFriends());
      }
    }
  }, [authToken, connected, dispatch, activeChannel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-60 min-w-60 bg-base-200 flex flex-col overflow-hidden relative shrink-0">
      <UserList
        users={filteredUsers}
        loading={memberList.loading}
        title={activeChannel ? `#${activeChannel} Members` : 'All Members'}
        showFriendRequests={!activeChannel}
      />
    </div>
  );
};
