import React, { useCallback, useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useHandcash } from "../../context/handcash";
import { useRelay } from "../../context/relay";
import { useWindowWidth } from "../../hooks";
import { loadUsers } from "../../reducers/memberListReducer";
import { toggleSidebar } from "../../reducers/sidebarReducer";
import Avatar from "./Avatar";
import List from "./List";
import ListItem from "./ListItem";

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
`;

const Content = styled.div`
  background-color: var(--background-secondary);
  flex: 1;
  height: calc(100vh - 48px - 52px);
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
  useEffect(() => {
    dispatch(loadUsers());
  }, [dispatch]);

  const { paymail } = useRelay();
  const { profile } = useHandcash();

  // const user = useSelector((state) => state.session.user);
  const memberList = useSelector((state) => state.memberList);
  const activeUserId = useSelector((state) => state.memberList.active);
  const isInDesktop = useWindowWidth() > 768;
  const messages = useSelector((state) => state.chat.messages);

  const hasMessages = messages.allIds.length > 0;
  const [hoveringUser, setHoveringUser] = useState();

  const mouseOver = useCallback(
    (id) => {
      if (id) {
        setHoveringUser(id);
      }
    },
    [hoveringUser]
  );

  const mouseOut = useCallback(
    (id) => {
      if (hoveringUser === id) {
        setHoveringUser(undefined);
      }
    },
    [hoveringUser]
  );

  const renderUser = useCallback(
    (id) => {
      console.log({ member: memberList.byId[id] });
      const member = memberList.byId[id];
      return (
        <Link
          key={id}
          to={`/@/${id}`}
          onClick={() => !isInDesktop && dispatch(toggleSidebar())}
        >
          <ListItem
            icon={<Avatar w={32} h={32} icon={member.user?.logo} />}
            text={member.user?.alternateName || id || "global"}
            style={{
              gap: "8px",
              padding: "8px 4px",
            }}
            id={id}
            isPinned={false}
            onMouseEnter={(e) => mouseOver(e.target.id)}
            onMouseLeave={(e) => mouseOut(e.target.id)}
            hasActivity={
              id &&
              messages?.allIds?.some(
                (mid) => messages.byId[mid]?.AIP?.bapId === id
              )
            }
            isActive={id === activeUserId || (!id && !activeUserId)}
            showPin={false}
            onClickPin={() => {}}
          />
        </Link>
      );
    },
    [hoveringUser, messages, isInDesktop, activeUserId, memberList.allIds]
  );

  useEffect(() => console.log({ memberList }), [memberList.allIds]);

  return (
    <Container className="disable-select">
      <Header>
        <Heading>Bitchat [Nitro]</Heading>
      </Header>
      <Content className="scrollable">
        <List gap="2px">
          {!memberList.loading && memberList.allIds.map(renderUser)}
        </List>
      </Content>
      <Footer>
        <Avatar
          size="21px"
          w="32px"
          // bgColor={user.avatarColor}
          bgcolor={"#000"}
          status="online"
          paymail={paymail || profile?.paymail}
        />
        {/* <Username>{user.username}</Username> */}
        <Username>{paymail || profile?.paymail}</Username>
      </Footer>
    </Container>
  );
};

export default UserList;
