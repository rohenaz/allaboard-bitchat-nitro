import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaPlus, FaUserFriends } from 'react-icons/fa';
import { MdArrowBack, MdKeyboardArrowDown } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RDLink } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { loadUsers } from '../../reducers/memberListReducer';
import { toggleSidebar } from '../../reducers/sidebarReducer';
import Avatar from './Avatar';
import List from './List';
import ListItem from './ListItem';
import DirectMessageModal from './modals/DirectMessageModal';

const Link = styled(RDLink)`
  &:hover {
    text-decoration: none;
  }
`;

const Container = styled.div`
  width: 240px;
  display: flex;
  flex-direction: column;
  text-overflow: ellipsis;
`;

const Header = styled.div`
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--background-tertiary);
  height: 48px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 0 16px;
`;

const Heading = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: flex;
  align-items: center;
`;

const Content = styled.div`
  background-color: var(--background-secondary);
  flex: 1;
  height: calc(100dvh - 48px - 52px);
  padding: 10px 2px 10px 8px;
`;

const Footer = styled.div`
  background-color: var(--background-secondary-alt);
  height: 52px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
`;

const Username = styled.div`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: var(--header-primary);
  font-weight: 600;
  font-size: 14px;
`;

const UserList = () => {
  const dispatch = useDispatch();
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const messages = useSelector((state) => state.chat.messages);
  const memberList = useSelector((state) => state.memberList);
  const session = useSelector((state) => state.session);
  const isInDesktop = useSelector((state) => state.app.isInDesktop);
  const { profile } = useHandcash();

  useEffect(() => {
    dispatch(loadUsers());
  }, [dispatch]);

  const renderUser = useCallback(
    (id) => {
      const member = memberList.byId[id];
      return (
        <Link
          key={id}
          to={`/@/${id}`}
          onClick={() => !isInDesktop && dispatch(toggleSidebar())}
        >
          <ListItem
            id={id}
            isPinned={false}
            hasActivity={
              id &&
              messages.allIds.some(
                (messageId) =>
                  messages.byId[messageId].MAP.paymail === member.paymail,
              )
            }
            text={member.paymail}
            icon={
              <Avatar
                size="27px"
                w="40px"
                bgcolor={'#000'}
                paymail={member.paymail}
                icon={member.logo}
              />
            }
          />
        </Link>
      );
    },
    [messages, isInDesktop, dispatch, memberList.byId],
  );

  const clickDm = useCallback(() => {
    setShowDirectMessageModal(true);
  }, []);

  const user = useMemo(() => {
    return session.memberList?.signers.byId[session.user.idKey];
  }, [session]);

  return (
    <Container className="disable-select">
      <Header>
        <Heading>
          <MdArrowBack style={{ marginRight: '.5rem' }} />
          <Link to={'/channels'}>Bitchat [Nitro]</Link>
        </Heading>
      </Header>
      <Content className="scrollable">
        <List gap={'2px'} style={{ width: '100%' }}>
          <Link
            key={'friends-menu-item-link'}
            to={'/friends'}
            onClick={() => !isInDesktop && dispatch(toggleSidebar())}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: ' space-between',
            }}
          >
            <ListItem
              showPin={false}
              style={{
                gap: '8px',
                padding: '8px 4px',
                width: '100%',
              }}
              icon={
                <FaUserFriends
                  width={'32px'}
                  height={'32px'}
                  style={{ margin: '0 .5rem' }}
                />
              }
              text={'Friends'}
              id={'friends-menu-item'}
            />
          </Link>
          <button
            className="w-full text-left flex items-center justify-between px-2 mb-1 text-[var(--channels-default)] cursor-pointer bg-transparent border-0"
            onClick={clickDm}
            type="button"
          >
            <ListItem text={'DIRECT MESSAGES'} icon={<MdKeyboardArrowDown />} />
          </button>
        </List>
        <List gap="2px">
          {!memberList.loading && memberList.allIds.map(renderUser)}
        </List>
      </Content>
      <Footer>
        <Avatar
          size="21px"
          w="32px"
          // bgColor={user.avatarColor}
          bgcolor={'#000'}
          status="online"
          paymail={user?.paymail || profile?.paymail}
        />
        {/* <Username>{user.username}</Username> */}
        <Username>{user?.identity?.alternateName || profile?.paymail}</Username>
      </Footer>
      <DirectMessageModal
        open={showDirectMessageModal}
        onClose={() => setShowDirectMessageModal(false)}
      />
    </Container>
  );
};

export default UserList;
